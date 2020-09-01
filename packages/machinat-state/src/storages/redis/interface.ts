import type { RedisClient } from 'redis';
import { makeInterface } from '@machinat/core/service';
import type { RedisStateModuleConfigs } from './types';

export const MODULE_CONFIGS_I = makeInterface<RedisStateModuleConfigs>({
  name: 'RedisStateModuleConfigsI',
});

export const CLIENT_I = makeInterface<RedisClient>({
  name: 'RedisClientI',
});