import type { RedisClient } from 'redis';
import { serviceInterface } from '@sociably/core/service';
import type { RedisStateConfigs } from './types.js';

/** @category Interface */
export const ConfigsI = serviceInterface<RedisStateConfigs>({
  name: 'RedisStateConfigs',
});

export type ConfigsI = RedisStateConfigs;

/** @category Interface */
export const ClientI = serviceInterface<RedisClient>({
  name: 'RedisClient',
});

export type ClientI = RedisClient;
