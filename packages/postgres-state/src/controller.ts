import { Pool } from 'pg';
import type { SociablyUser, SociablyChannel } from '@sociably/core';
import { makeClassProvider } from '@sociably/core/service';
import BaseMarshaler from '@sociably/core/base/Marshaler';
import type {
  BaseStateController,
  StateAccessor,
} from '@sociably/core/base/StateController';
import {
  DEFAULT_STATE_TABLE_NAME,
  FIELD_STATE_PLATFORM,
  FIELD_STATE_TYPE,
  FIELD_STATE_SCOPE_ID,
  FIELD_STATE_DATA,
  FIELD_STATE_KEY,
  FIELD_STATE_ID,
} from './constants';
import { ConnectionPoolI, ConfigsI } from './interface';
import { SociablyStateType, StateEntity } from './types';

const tableId = (schemaName: undefined | string, tableName: string) => {
  return schemaName ? `"${schemaName}"."${tableName}"` : `"${tableName}"`;
};

export class PostgresStateAccessor implements StateAccessor {
  private _pool: Pool;
  private _marshaler: BaseMarshaler;
  private _schemaName?: string;
  private _tableName: string;
  private _stateType: SociablyStateType;
  private _statePlatform: null | string;
  private _stateScope: null | string;
  private _stateId: string;

  constructor(
    pool: Pool,
    marshaler: BaseMarshaler,
    schemaName: undefined | string,
    tableName: string,
    type: SociablyStateType,
    statePlatform: null | string,
    stateScope: null | string,
    stateId: string
  ) {
    this._pool = pool;
    this._tableName = tableName;
    this._schemaName = schemaName;
    this._marshaler = marshaler;
    this._stateType = type;
    this._statePlatform = statePlatform;
    this._stateScope = stateScope;
    this._stateId = stateId;
  }

  async get<T>(key: string): Promise<undefined | T> {
    const {
      rows: [stateEntity],
    } = await this._pool.query<StateEntity>(
      this._selectStateEntitiesQuery(key)
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
      this._setStateDataQuery(key, dataValue)
    );

    return !inserted;
  }

  update<T>(key: string, updator: (value: undefined | T) => T): Promise<T>;
  async update<T>(
    key: string,
    updator: (value: undefined | T) => undefined | T
  ): Promise<undefined | T> {
    const client = await this._pool.connect();
    try {
      await client.query('BEGIN');
      const {
        rows: [stateEntity],
      } = await client.query<StateEntity>(
        this._selectStateEntitiesQuery(key, true)
      );

      const currentValue = stateEntity
        ? this._getUnmarshaledDataValue<T>(stateEntity.data.value)
        : undefined;
      const newValue = updator(currentValue);

      if (newValue === undefined) {
        await client.query<StateEntity>(this._deleteStateEntitiesQuery(key));
      } else if (newValue !== currentValue) {
        await client.query<StateEntity>(
          this._setStateDataQuery(key, this._prepareDataValueToSave(newValue))
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
    const result = await this._pool.query<StateEntity>(
      this._deleteStateEntitiesQuery(key)
    );
    return result.rowCount > 0;
  }

  async keys(): Promise<string[]> {
    const result = await this._pool.query<StateEntity>(
      this._selectStateEntitiesQuery(null)
    );
    return result.rows.map(({ key }) => key);
  }

  async getAll<T>(): Promise<Map<string, T>> {
    const result = await this._pool.query<StateEntity>(
      this._selectStateEntitiesQuery(null)
    );
    return new Map(
      result.rows.map(({ key, data }) => [
        key,
        this._getUnmarshaledDataValue<T>(data.value),
      ])
    );
  }

  async clear(): Promise<undefined> {
    await this._pool.query<StateEntity>(this._deleteStateEntitiesQuery(null));
    return undefined;
  }

  private _prepareDataValueToSave<T>(value: T) {
    return this._marshaler.marshal(value);
  }

  private _getUnmarshaledDataValue<T>(value: unknown): T {
    return this._marshaler.unmarshal(value);
  }

  private _getKeyFieldPairs(key: null | string) {
    const pairs = [
      [FIELD_STATE_TYPE, this._stateType],
      [FIELD_STATE_PLATFORM, this._statePlatform || ''],
      [FIELD_STATE_SCOPE_ID, this._stateScope || ''],
      [FIELD_STATE_ID, this._stateId],
    ];

    if (key) {
      pairs.push([FIELD_STATE_KEY, key]);
    }
    return pairs;
  }

  private _getKeyFieldFilterPart(key: null | string) {
    const keyFieldPairs = this._getKeyFieldPairs(key);

    return {
      text: keyFieldPairs.map(([k], i) => `"${k}" = $${i + 1}`).join(' AND '),
      params: keyFieldPairs.map(([_, v]) => v),
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
    const keyFieldPairs = this._getKeyFieldPairs(key);
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
        SET "${FIELD_STATE_DATA}" = EXCLUDED."${FIELD_STATE_DATA}"
        RETURNING (xmax = 0) AS inserted;
      `,
      values: [{ value }, ...keyFieldPairs.map(([_, v]) => v)],
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

const identity = (x) => x;

/**
 * @category Provider
 */
export class PostgresStateController implements BaseStateController {
  private _pool: Pool;
  private _marshaler: BaseMarshaler;
  schemaName?: string;
  tableName: string;

  constructor(
    pool: Pool,
    marshaler?: null | BaseMarshaler,
    schemaName?: string,
    tableName?: string
  ) {
    this._pool = pool;
    this.schemaName = schemaName;
    this.tableName = tableName || DEFAULT_STATE_TABLE_NAME;
    this._marshaler = marshaler || {
      marshal: identity,
      unmarshal: identity,
    };
  }

  channelState(channel: SociablyChannel): PostgresStateAccessor {
    const identifier = channel.uniqueIdentifier;

    return new PostgresStateAccessor(
      this._pool,
      this._marshaler,
      this.schemaName,
      this.tableName,
      'channel',
      identifier.platform,
      identifier.scopeId?.toString() || null,
      identifier.id.toString()
    );
  }

  userState(user: SociablyUser): PostgresStateAccessor {
    const identifier = user.uniqueIdentifier;

    return new PostgresStateAccessor(
      this._pool,
      this._marshaler,
      this.schemaName,
      this.tableName,
      'user',
      identifier.platform,
      identifier.scopeId?.toString() || null,
      identifier.id.toString()
    );
  }

  globalState(name: string): PostgresStateAccessor {
    return new PostgresStateAccessor(
      this._pool,
      this._marshaler,
      this.schemaName,
      this.tableName,
      'global',
      null,
      null,
      name
    );
  }

  async createTable(): Promise<void> {
    await this._pool.query(`
      ${
        this.schemaName
          ? `CREATE SCHEMA IF NOT EXISTS "${this.schemaName}";`
          : ''
      }
      CREATE TYPE "state_type" AS ENUM('channel', 'user', 'global');
      CREATE TABLE IF NOT EXISTS ${this._tableId()} (
        "${FIELD_STATE_TYPE}" state_type,
        "${FIELD_STATE_PLATFORM}" varchar(30),
        "${FIELD_STATE_SCOPE_ID}" varchar(255),
        "${FIELD_STATE_ID}" varchar(255),
        "${FIELD_STATE_KEY}" varchar(255),
        "${FIELD_STATE_DATA}" jsonb,
        PRIMARY KEY (
          "${FIELD_STATE_TYPE}",
          "${FIELD_STATE_PLATFORM}",
          "${FIELD_STATE_SCOPE_ID}",
          "${FIELD_STATE_ID}",
          "${FIELD_STATE_KEY}"
        )
      );
    `);
  }

  async dropTable(): Promise<void> {
    await this._pool.query(`
      DROP TABLE IF EXISTS ${this._tableId()} CASCADE;
      DROP TYPE IF EXISTS "state_type" CASCADE;
  `);
  }

  private _tableId() {
    return tableId(this.schemaName, this.tableName);
  }
}

export const ControllerP = makeClassProvider({
  lifetime: 'singleton',
  deps: [ConfigsI, ConnectionPoolI, { require: BaseMarshaler, optional: true }],
  factory: (configs, pool, marshaler) =>
    new PostgresStateController(
      pool,
      marshaler,
      configs.schemaName,
      configs.tableName
    ),
})(PostgresStateController);

export type ControllerP = PostgresStateController;
