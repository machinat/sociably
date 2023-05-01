import { PoolConfig } from 'pg';
import {
  FIELD_STATE_TYPE,
  FIELD_STATE_PLATFORM,
  FIELD_STATE_SCOPE_ID,
  FIELD_STATE_DATA,
  FIELD_STATE_KEY,
  FIELD_STATE_ID,
} from './constants';

export type PostgresStateConfigs = {
  /** schema used to store state data */
  schemaName?: string;
  /** table used to store state data */
  tableName?: string;
  /** options to connect with DB */
  connectOptions: PoolConfig;
};

export type SociablyStateType = 'channel' | 'global' | 'thread' | 'user';

/**
 * The entity value stored in the DB. `platform` & `scopeId` use `''`
 * but not `null` when it's empty because `null` cannot be idnetified
 * on an unique index in pg.
 */
export type StateEntity = {
  [FIELD_STATE_TYPE]: SociablyStateType;
  // '' on global state
  [FIELD_STATE_PLATFORM]: string;
  // '' on global state or when scopeId of a thread/user is null
  [FIELD_STATE_SCOPE_ID]: string;
  [FIELD_STATE_ID]: string;
  [FIELD_STATE_KEY]: string;
  [FIELD_STATE_DATA]: { value: unknown };
};
