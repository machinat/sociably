// @flow
import redis from 'redis';
import { factory, inject } from '@machinat/core/service';
import { StateRepositoryI } from '../../interface';
import RedisRepository from './repository';
import { REDIS_MODULE_CONFIGS_I, REDIS_CLIENT_I } from './interface';
import type { RedisModuleConfigs, RedisClient } from './types';

const createRedisClient = factory<RedisClient>({
  lifetime: 'singleton',
  deps: [REDIS_MODULE_CONFIGS_I],
})(configs => redis.createClient(configs));

const RedisStorage = {
  Client: REDIS_CLIENT_I,
  Repository: RedisRepository,
  CONFIGS: REDIS_MODULE_CONFIGS_I,

  initModule: (configs: RedisModuleConfigs) => ({
    provisions: [
      RedisRepository,
      { provide: StateRepositoryI, withProvider: RedisRepository },
      { provide: REDIS_CLIENT_I, withProvider: createRedisClient },
      { provide: REDIS_MODULE_CONFIGS_I, withValue: configs },
    ],
    startHook: inject<Promise<void>>({ deps: [REDIS_CLIENT_I] })(
      async (client: RedisClient) => {
        if (!client.connected) {
          await new Promise((resolve, reject) => {
            client.once('ready', resolve);
            client.once('error', reject);
          });
        }
      }
    ),
  }),
};

export default RedisStorage;
