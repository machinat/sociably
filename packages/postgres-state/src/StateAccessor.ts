import { Pool } from 'pg';
import BaseMarshaler from '@sociably/core/base/Marshaler';
import type { StateAccessor } from '@sociably/core/base/StateController';
import { FIELD_STATE_DATA, FIELD_UPDATED_AT } from './constants.js';
import tableId from './utils/tableId.js';
import { InstanceStateEntity } from './types.js';

type IdentifierFieldsGetter = (key: null | string) => [string, string][];

export class PostgresInstanceStateAccessor implements StateAccessor {
  private _pool: Pool;
  private _marshaler: BaseMarshaler;
  private _schemaName?: string;
  private _tableName: string;
  private _getIdentifierFields: IdentifierFieldsGetter;

  constructor(
    pool: Pool,
    marshaler: BaseMarshaler,
    getIdentifierFields: IdentifierFieldsGetter,
    schemaName: undefined | string,
    tableName: string,
  ) {
    this._pool = pool;
    this._marshaler = marshaler;
    this._getIdentifierFields = getIdentifierFields;
    this._tableName = tableName;
    this._schemaName = schemaName;
  }

  async get<T>(key: string): Promise<undefined | T> {
    const {
      rows: [stateEntity],
    } = await this._pool.query<InstanceStateEntity>(
      this._selectStateEntitiesQuery(key),
    );

    if (!stateEntity) {
      return undefined;
    }
    return this._getUnmarshaledDataValue(stateEntity.data.value);
  }

  async set<T>(key: string, state: T): Promise<boolean> {
    const dataValue = this._prepareDataValueToSave(state);

    const {
      rows: [{ inserted }],
    } = await this._pool.query<{ inserted: boolean }>(
      this._setStateDataQuery(key, dataValue),
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
      } = await client.query<InstanceStateEntity>(
        this._selectStateEntitiesQuery(key, true),
      );

      const currentValue = stateEntity
        ? this._getUnmarshaledDataValue<T>(stateEntity.data.value)
        : undefined;
      const newValue = updator(currentValue);

      if (newValue === undefined) {
        await client.query<InstanceStateEntity>(
          this._deleteStateEntitiesQuery(key),
        );
      } else if (newValue !== currentValue) {
        await client.query<InstanceStateEntity>(
          this._setStateDataQuery(key, this._prepareDataValueToSave(newValue)),
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
    const result = await this._pool.query<InstanceStateEntity>(
      this._deleteStateEntitiesQuery(key),
    );
    return result.rowCount > 0;
  }

  async keys(): Promise<string[]> {
    const result = await this._pool.query<InstanceStateEntity>(
      this._selectStateEntitiesQuery(null),
    );
    return result.rows.map(({ key }) => key);
  }

  async getAll<T>(): Promise<Map<string, T>> {
    const result = await this._pool.query<InstanceStateEntity>(
      this._selectStateEntitiesQuery(null),
    );
    return new Map(
      result.rows.map(({ key, data }) => [
        key,
        this._getUnmarshaledDataValue<T>(data.value),
      ]),
    );
  }

  async clear(): Promise<undefined> {
    await this._pool.query<InstanceStateEntity>(
      this._deleteStateEntitiesQuery(null),
    );
    return undefined;
  }

  private _prepareDataValueToSave<T>(value: T) {
    return this._marshaler.marshal(value);
  }

  private _getUnmarshaledDataValue<T>(value: unknown): T {
    return this._marshaler.unmarshal(value);
  }

  private _getKeyFieldFilterPart(key: null | string) {
    const keyFieldPairs = this._getIdentifierFields(key);

    return {
      text: keyFieldPairs.map(([k], i) => `"${k}" = $${i + 1}`).join(' AND '),
      params: keyFieldPairs.map(([, v]) => v),
    };
  }

  private _tableId() {
    return tableId(this._schemaName, this._tableName);
  }

  private _selectStateEntitiesQuery(key: null | string, forUpdate?: boolean) {
    const keyFieldFilter = this._getKeyFieldFilterPart(key);
    return {
      text: `
        SELECT * FROM ${this._tableId()}
        WHERE ${keyFieldFilter.text}${forUpdate ? ' FOR UPDATE' : ''};
      `,
      values: keyFieldFilter.params,
    };
  }

  private _setStateDataQuery(key: string, value: unknown) {
    const keyFieldPairs = this._getIdentifierFields(key);
    const keyFieldNamesStr = keyFieldPairs
      .map(([name]) => `"${name}"`)
      .join(', ');

    return {
      text: `
        INSERT INTO ${this._tableId()} (
          "${FIELD_STATE_DATA}",
          ${keyFieldNamesStr}
        )
        VALUES (
          $1,
          ${keyFieldPairs.map((_, i) => `$${i + 2}`).join(', ')}
        )
        ON CONFLICT (${keyFieldNamesStr}) DO UPDATE
        SET
          "${FIELD_STATE_DATA}" = EXCLUDED."${FIELD_STATE_DATA}",
          "${FIELD_UPDATED_AT}" = current_timestamp
        RETURNING (xmax = 0) AS inserted;
      `,
      values: [{ value }, ...keyFieldPairs.map(([, v]) => v)],
    };
  }

  private _deleteStateEntitiesQuery(key: null | string) {
    const keyFieldFilter = this._getKeyFieldFilterPart(key);
    return {
      text: `
        DELETE FROM ${this._tableId()}
        WHERE ${keyFieldFilter.text};
      `,
      values: keyFieldFilter.params,
    };
  }
}

export default PostgresInstanceStateAccessor;
