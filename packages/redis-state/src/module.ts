import redis from 'redis';
import { makeFactoryProvider, makeContainer } from '@machinat/core/service';
import type { ServiceModule } from '@machinat/core/types';
import StateControllerI from '@machinat/core/base/StateControllerI';

import { ControllerP } from './controller';
import {
  ConfigsI as StateConfigsI,
  ClientI as RedisClientI,
} from './interface';

/** @internal */
const createRedisClient = makeFactoryProvider({
  lifetime: 'singleton',
  deps: [StateConfigsI] as const,
})(({ clientOptions }) => redis.createClient(clientOptions));

/**
 * @category Root
 */
const RedisState = {
  Controller: ControllerP,
  ClientI: RedisClientI,
  ConfigsI: StateConfigsI,

  initModule: (configs: StateConfigsI): ServiceModule => ({
    provisions: [
      ControllerP,
      { provide: StateControllerI, withProvider: ControllerP },

      { provide: RedisClientI, withProvider: createRedisClient },
      { provide: StateConfigsI, withValue: configs },
    ],

    startHook: makeContainer({ deps: [RedisClientI] })(
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

/**
 * @category Root
 */
declare namespace RedisState {
  export type Controller = ControllerP;
  export type ConfigsI = StateConfigsI;
  export type ClientI = RedisClientI;
}

export default RedisState;
