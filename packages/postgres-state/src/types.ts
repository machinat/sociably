import { PoolConfig } from 'pg';
import {
  FIELD_STATE_DATA,
  FIELD_STATE_KEY,
  FIELD_STATE_ID,
} from './constants.js';

export type PostgresStateConfigs = {
  /** The schema used to create state tables */
  schemaName?: string;
  /** The table used to store global state data */
  globalStateTableName?: string;
  /** The table used to store agent state data */
  agentStateTableName?: string;
  /** The table used to store thread state data */
  threadStateTableName?: string;
  /** The table used to store user state data */
  userStateTableName?: string;
  /** Options to connect with DB */
  connectOptions: PoolConfig;
};

export type SociablyStateType = 'agent' | 'global' | 'thread' | 'user';

export type BasicStateEntity = {
  [FIELD_STATE_ID]: string;
  [FIELD_STATE_KEY]: string;
  [FIELD_STATE_DATA]: { value: unknown };
};
