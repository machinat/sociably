import type { RedisClient } from 'redis';
import { makeInterface } from '@machinat/core/service';
import type { RedisStateConfigs } from './types';

/**
 * @category Interface
 */
export const ConfigsI = makeInterface<RedisStateConfigs>({
  name: 'RedisStateConfigsI',
});

export type ConfigsI = RedisStateConfigs;

/**
 * @category Interface
 */
export const ClientI = makeInterface<RedisClient>({
  name: 'RedisClientI',
});

export type ClientI = RedisClient;
