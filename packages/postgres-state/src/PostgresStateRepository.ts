import { Pool } from 'pg';
import type {
  SociablyChannel,
  SociablyUser,
  SociablyThread,
} from '@sociably/core';
import { serviceProviderClass } from '@sociably/core/service';
import BaseMarshaler from '@sociably/core/base/Marshaler.js';
import type {
  BaseStateRepository,
  StateAccessor,
} from '@sociably/core/base/StateRepository.js';
import {
  DEFAULT_GLOBAL_STATE_TABLE_NAME,
  DEFAULT_CHANNEL_STATE_TABLE_NAME,
  DEFAULT_THREAD_STATE_TABLE_NAME,
  DEFAULT_USER_STATE_TABLE_NAME,
  FIELD_STATE_DATA,
  FIELD_STATE_KEY,
  FIELD_STATE_ID,
  FIELD_CREATED_AT,
  FIELD_UPDATED_AT,
} from './constants.js';
import PostgresStateAccessor from './PostgresStateAccessor.js';
import tableId from './utils/tableId.js';
import { ConnectionPoolI, ConfigsI } from './interface.js';

const identity = (x) => x;

export type TableNamingOptions = {
  schemaName?: string;
  globalStateTableName?: string;
  channelStateTableName?: string;
  threadStateTableName?: string;
  userStateTableName?: string;
};

/** @category Provider */
export class PostgresStateRepository implements BaseStateRepository {
  private _pool: Pool;
  private _marshaler: BaseMarshaler;
  schemaName?: string;
  globalStateTableName: string;
  channelStateTableName: string;
  threadStateTableName: string;
  userStateTableName: string;

  constructor(
    pool: Pool,
    marshaler?: null | BaseMarshaler,
    {
      schemaName,
      globalStateTableName = DEFAULT_GLOBAL_STATE_TABLE_NAME,
      channelStateTableName = DEFAULT_CHANNEL_STATE_TABLE_NAME,
      threadStateTableName = DEFAULT_THREAD_STATE_TABLE_NAME,
      userStateTableName = DEFAULT_USER_STATE_TABLE_NAME,
    }: TableNamingOptions = {},
  ) {
    this._pool = pool;
    this._marshaler = marshaler || {
      marshal: identity,
      unmarshal: identity,
    };

    this.schemaName = schemaName;
    this.globalStateTableName = globalStateTableName;
    this.channelStateTableName = channelStateTableName;
    this.threadStateTableName = threadStateTableName;
    this.userStateTableName = userStateTableName;
  }

  channelState(channel: SociablyChannel): StateAccessor {
    return new PostgresStateAccessor(
      this._pool,
      this._marshaler,
      this.schemaName,
      this.channelStateTableName,
      channel.uid,
    );
  }

  threadState(thread: SociablyThread): StateAccessor {
    return new PostgresStateAccessor(
      this._pool,
      this._marshaler,
      this.schemaName,
      this.threadStateTableName,
      thread.uid,
    );
  }

  userState(user: SociablyUser): StateAccessor {
    return new PostgresStateAccessor(
      this._pool,
      this._marshaler,
      this.schemaName,
      this.userStateTableName,
      user.uid,
    );
  }

  globalState(stateId: string): StateAccessor {
    return new PostgresStateAccessor(
      this._pool,
      this._marshaler,
      this.schemaName,
      this.globalStateTableName,
      stateId,
    );
  }

  async createTables(): Promise<void> {
    await this._pool.query(`
      ${
        this.schemaName
          ? `CREATE SCHEMA IF NOT EXISTS "${this.schemaName}";`
          : ''
      }
      ${[
        this.channelStateTableName,
        this.threadStateTableName,
        this.userStateTableName,
        this.globalStateTableName,
      ]
        .map(
          (tableName) => `
      CREATE TABLE IF NOT EXISTS ${this._tableId(tableName)} (
        "${FIELD_STATE_ID}" varchar(255),
        "${FIELD_STATE_KEY}" varchar(255),
        "${FIELD_STATE_DATA}" jsonb,
        "${FIELD_CREATED_AT}" timestamp DEFAULT current_timestamp,
        "${FIELD_UPDATED_AT}" timestamp DEFAULT current_timestamp,
        PRIMARY KEY (
          "${FIELD_STATE_ID}",
          "${FIELD_STATE_KEY}"
        )
      );`,
        )
        .join('')}
    `);
  }

  async dropTables(): Promise<void> {
    await this._pool.query(`
      DROP TABLE IF EXISTS ${this._tableId(this.globalStateTableName)} CASCADE;
      DROP TABLE IF EXISTS ${this._tableId(this.channelStateTableName)} CASCADE;
      DROP TABLE IF EXISTS ${this._tableId(this.threadStateTableName)} CASCADE;
      DROP TABLE IF EXISTS ${this._tableId(this.userStateTableName)} CASCADE;
  `);
  }

  private _tableId(tableName: string) {
    return tableId(this.schemaName, tableName);
  }
}

export const RepositoryP = serviceProviderClass({
  lifetime: 'singleton',
  deps: [ConnectionPoolI, { require: BaseMarshaler, optional: true }, ConfigsI],
})(PostgresStateRepository);

export type RepositoryP = PostgresStateRepository;
