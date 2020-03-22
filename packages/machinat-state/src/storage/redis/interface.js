// @flow
/* eslint-disable import/prefer-default-export */
import { namedInterface } from '@machinat/core/service';
import type { RedisModuleConfigs, RedisClient } from './types';

export const REDIS_MODULE_CONFIGS_I = namedInterface<RedisModuleConfigs>(
  'RedisModuleConfigs'
);

export const REDIS_CLIENT_I = namedInterface<RedisClient>('RedisClient');
