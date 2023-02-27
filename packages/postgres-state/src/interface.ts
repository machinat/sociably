import type { Pool } from 'pg';
import { makeInterface } from '@sociably/core/service';
import type { PostgresStateConfigs } from './types';

/**
 * @category Interface
 */
export const ConfigsI = makeInterface<PostgresStateConfigs>({
  name: 'PostgresStateConfigs',
});

export type ConfigsI = PostgresStateConfigs;

/**
 * @category Interface
 */
export const ConnectionPoolI = makeInterface<Pool>({
  name: 'PostgresConnectionPool',
});

export type ConnectionPoolI = Pool;
