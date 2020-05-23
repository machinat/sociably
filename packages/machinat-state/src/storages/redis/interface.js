// @flow
/* eslint-disable import/prefer-default-export */
import { makeInterface, abstractInterface } from '@machinat/core/service';
import type { RedisStateConfigs } from './types';

export const REDIS_STATE_CONFIGS_I = makeInterface<RedisStateConfigs>({
  name: 'RedisStateConfigs',
});

class AbstractRedisClient {
  // TODO: type the client
}

export const RedisClientI = abstractInterface<any>()(AbstractRedisClient);
