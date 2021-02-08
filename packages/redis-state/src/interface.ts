import type { RedisClient } from 'redis';
import { makeInterface } from '@machinat/core/service';
import type { RedisStateConfigs } from './types';

/**
 * @category Interface
 */
export const ConfigsI = makeInterface<RedisStateConfigs>({
  name: 'RedisStateConfigs',
});

export type ConfigsI = RedisStateConfigs;

/**
 * @category Interface
 */
export const ClientI = makeInterface<RedisClient>({
  name: 'RedisClient',
});

export type ClientI = RedisClient;
