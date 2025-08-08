import { Pool } from 'pg';
import BaseMarshaler from '@sociably/core/base/Marshaler.js';
import type { StateAccessor } from '@sociably/core/base/StateRepository.js';
import {
  FIELD_STATE_DATA,
  FIELD_STATE_ID,
  FIELD_STATE_KEY,
  FIELD_UPDATED_AT,
} from './constants.js';
import tableId from './utils/tableId.js';
import type { BasicStateEntity } from './types.js';

export class PostgresStateAccessor implements StateAccessor {
  private _pool: Pool;
  private _marshaler: BaseMarshaler;
  private _schemaName?: string;
  private _tableName: string;
  private _stateId: string;

  constructor(
    pool: Pool,
    marshaler: BaseMarshaler,
    schemaName: undefined | string,
    tableName: string,
    stateId: string,
  ) {
    this._pool = pool;
    this._marshaler = marshaler;
    this._tableName = tableName;
    this._schemaName = schemaName;
    this._stateId = stateId;
  }

  async get<T>(key: string): Promise<undefined | T> {
    const {
      rows: [stateEntity],
    } = await this._pool.query<BasicStateEntity>(this._selectStatesQuery(key));

    if (!stateEntity) {
      return undefined;
    }
    return this._getUnmarshaledValue(stateEntity.data);
  }

  async set<T>(key: string, state: T): Promise<boolean> {
    const {
      rows: [{ inserted }],
    } = await this._pool.query<{ inserted: boolean }>(
      this._setStateDataQuery(key, state),
    );

    return !inserted;
  }

  update<T>(key: string, updator: (value: undefined | T) => T): Promise<T>;
  async update<T>(
    key: string,
    updator: (value: undefined | T) => undefined | T,
  ): Promise<undefined | T> {
    const client = await this._pool.connect();
    try {
      await client.query('BEGIN');
      const {
        rows: [stateEntity],
      } = await client.query<BasicStateEntity>(
        this._selectStatesQuery(key, true),
      );

      const currentValue = stateEntity
        ? this._getUnmarshaledValue<T>(stateEntity.data)
        : undefined;
      const newValue = updator(currentValue);

      if (newValue === undefined) {
        await client.query<BasicStateEntity>(
          this._deleteStateEntitiesQuery(key),
        );
      } else if (newValue !== currentValue) {
        await client.query<BasicStateEntity>(
          this._setStateDataQuery(key, newValue),
        );
      }

      await client.query('COMMIT');
      return newValue;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async delete(key: string): Promise<boolean> {
    const result = await this._pool.query<BasicStateEntity>(
      this._deleteStateEntitiesQuery(key),
    );
    return result.rowCount > 0;
  }

  async keys(): Promise<string[]> {
    const result = await this._pool.query<BasicStateEntity>(
      this._selectStatesQuery(null),
    );
    return result.rows.map(({ key }) => key);
  }

  async getAll<T>(): Promise<Map<string, T>> {
    const result = await this._pool.query<BasicStateEntity>(
      this._selectStatesQuery(null),
    );
    return new Map(
      result.rows.map(({ key, data }) => [
        key,
        this._getUnmarshaledValue<T>(data),
      ]),
    );
  }

  async getAllStartWithKey<T>(prefix: string): Promise<Map<string, T>> {
    const result = await this._pool.query<BasicStateEntity>(
      this._selectStatesQuery(null, false, [
        {
          text: `"${FIELD_STATE_KEY}" LIKE`,
          value: `${prefix}%`,
        },
      ]),
    );
    return new Map(
      result.rows.map(({ key, data }) => [
        key,
        this._getUnmarshaledValue<T>(data),
      ]),
    );
  }

  async clear(): Promise<undefined> {
    await this._pool.query<BasicStateEntity>(
      this._deleteStateEntitiesQuery(null),
    );
    return undefined;
  }

  private _prepareDataToSave<T>(value: T) {
    return { value: this._marshaler.marshal(value) };
  }

  private _getUnmarshaledValue<T>(data: { value: unknown }): T {
    return this._marshaler.unmarshal(data.value);
  }

  /* eslint-disable no-plusplus */
  private _getFilter(
    key: null | string,
    additionalFilters: { text: string; value: unknown }[] = [],
  ) {
    let paramsCount = 1;
    return {
      filterText: `"${FIELD_STATE_ID}" = $${paramsCount++}${
        key ? ` AND "${FIELD_STATE_KEY}" = $${paramsCount++}` : ''
      }${additionalFilters
        .map(({ text }) => ` AND ${text} $${paramsCount++}`)
        .join('')}`,
      filterParams: [
        this._stateId,
        ...(key ? [key] : []),
        ...additionalFilters.map(({ value }) => value),
      ],
    };
  }
  /* eslint-enable no-plusplus */

  private _tableId() {
    return tableId(this._schemaName, this._tableName);
  }

  private _selectStatesQuery(
    key: null | string,
    forUpdate?: boolean,
    additionalFilters?: { text: string; value: unknown }[],
  ) {
    const { filterText, filterParams } = this._getFilter(
      key,
      additionalFilters,
    );
    return {
      text: `
        SELECT * FROM ${this._tableId()}
        WHERE ${filterText}${forUpdate ? ' FOR UPDATE' : ''};
      `,
      values: filterParams,
    };
  }

  private _setStateDataQuery(key: string, value: unknown) {
    return {
      text: `
        INSERT INTO ${this._tableId()} (
          "${FIELD_STATE_ID}",
          "${FIELD_STATE_KEY}",
          "${FIELD_STATE_DATA}"
        )
        VALUES ($1, $2, $3)
        ON CONFLICT ("${FIELD_STATE_ID}", "${FIELD_STATE_KEY}")
        DO UPDATE SET
          "${FIELD_STATE_DATA}" = EXCLUDED."${FIELD_STATE_DATA}",
          "${FIELD_UPDATED_AT}" = current_timestamp
        RETURNING (xmax = 0) AS inserted;
      `,
      values: [this._stateId, key, this._prepareDataToSave(value)],
    };
  }

  private _deleteStateEntitiesQuery(key: null | string) {
    const { filterText, filterParams } = this._getFilter(key);
    return {
      text: `
        DELETE FROM ${this._tableId()}
        WHERE ${filterText};
      `,
      values: filterParams,
    };
  }
}

export default PostgresStateAccessor;
