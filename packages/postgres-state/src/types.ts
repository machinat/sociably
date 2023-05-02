import { PoolConfig } from 'pg';
import {
  FIELD_STATE_PLATFORM,
  FIELD_STATE_SCOPE_ID,
  FIELD_STATE_DATA,
  FIELD_STATE_KEY,
  FIELD_STATE_ID,
} from './constants';

export type PostgresStateConfigs = {
  /** The schema used to create state tables */
  schemaName?: string;
  /** The table used to store global state data */
  globalStateTableName?: string;
  /** The table used to store channel state data */
  channelStateTableName?: string;
  /** The table used to store thread state data */
  threadStateTableName?: string;
  /** The table used to store user state data */
  userStateTableName?: string;
  /** options to connect with DB */
  connectOptions: PoolConfig;
};

export type SociablyStateType = 'channel' | 'global' | 'thread' | 'user';

export type BasicStateEntity = {
  [FIELD_STATE_ID]: string;
  [FIELD_STATE_KEY]: string;
  [FIELD_STATE_DATA]: { value: unknown };
};

export type InstanceStateEntity = BasicStateEntity & {
  [FIELD_STATE_PLATFORM]: string;
  // NOTE: use '' when `scopeId` is null, cuz null can't be identified by unique index
  [FIELD_STATE_SCOPE_ID]: string;
};
