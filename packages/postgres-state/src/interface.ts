import type { Pool } from 'pg';
import { serviceInterface } from '@sociably/core/service';
import type { PostgresStateConfigs } from './types.js';

/**
 * @category Interface
 */
export const ConfigsI = serviceInterface<PostgresStateConfigs>({
  name: 'PostgresStateConfigs',
});

export type ConfigsI = PostgresStateConfigs;

/**
 * @category Interface
 */
export const ConnectionPoolI = serviceInterface<Pool>({
  name: 'PostgresConnectionPool',
});

export type ConnectionPoolI = Pool;
