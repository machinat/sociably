// @flow
/* eslint-disable import/prefer-default-export */
import { namedInterface, abstractInterface } from '@machinat/core/service';
import type { RedisModuleConfigs } from './types';

export const REDIS_MODULE_CONFIGS_I = namedInterface<RedisModuleConfigs>({
  name: 'RedisModuleConfigs',
});

class AbstractRedisClient {
  // TODO: type the client
}

export const RedisClientI = abstractInterface<any>()(AbstractRedisClient);
