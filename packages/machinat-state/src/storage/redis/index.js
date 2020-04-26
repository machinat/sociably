// @flow
import redis from 'redis';
import { factory, container } from '@machinat/core/service';
import { StateRepositoryI } from '../../interface';
import RedisRepository from './repository';
import { REDIS_MODULE_CONFIGS_I, RedisClientI } from './interface';
import type { RedisModuleConfigs } from './types';

const createRedisClient = factory<RedisClientI>({
  lifetime: 'singleton',
  deps: [REDIS_MODULE_CONFIGS_I],
})(configs => redis.createClient(configs));

const RedisStorage = {
  ClientI: RedisClientI,
  Repository: RedisRepository,
  CONFIGS_I: REDIS_MODULE_CONFIGS_I,

  initModule: (configs: RedisModuleConfigs) => ({
    provisions: [
      RedisRepository,
      { provide: StateRepositoryI, withProvider: RedisRepository },
      { provide: RedisClientI, withProvider: createRedisClient },
      { provide: REDIS_MODULE_CONFIGS_I, withValue: configs },
    ],
    startHook: container<Promise<void>>({ deps: [RedisClientI] })(
      async (client: RedisClientI) => {
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
