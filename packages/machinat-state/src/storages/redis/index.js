// @flow
import redis from 'redis';
import { factory, container } from '@machinat/core/service';
import Base from '@machinat/core/base';
import StateController from '../../controller';
import { StateRepositoryI } from '../../interface';
import RedisRepository from './repository';
import { REDIS_STATE_CONFIGS_I, RedisClientI } from './interface';
import type { RedisStateConfigs } from './types';

const createRedisClient = factory<RedisClientI>({
  lifetime: 'singleton',
  deps: [REDIS_STATE_CONFIGS_I],
})(configs => redis.createClient(configs));

const RedisState = {
  ClientI: RedisClientI,
  Repository: RedisRepository,
  CONFIGS_I: REDIS_STATE_CONFIGS_I,

  initModule: (configs: RedisStateConfigs) => ({
    provisions: [
      StateController,
      { provide: Base.StateControllerI, withProvider: StateController },

      RedisRepository,
      { provide: StateRepositoryI, withProvider: RedisRepository },
      { provide: RedisClientI, withProvider: createRedisClient },
      { provide: REDIS_STATE_CONFIGS_I, withValue: configs },
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

export default RedisState;
