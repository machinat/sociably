import redis from 'redis';
import { makeFactoryProvider, makeContainer } from '@machinat/core/service';
import type { ServiceModule } from '@machinat/core/types';
import StateControllerI from '@machinat/core/base/StateController';

import { ControllerP } from './controller';
import { ConfigsI, ClientI } from './interface';

/** @internal */
const createRedisClient = makeFactoryProvider({
  lifetime: 'singleton',
  deps: [ConfigsI] as const,
})(({ clientOptions }) => redis.createClient(clientOptions));

/**
 * @category Root
 */
const RedisState = {
  Controller: ControllerP,
  Client: ClientI,
  Configs: ConfigsI,

  initModule: (configs: ConfigsI): ServiceModule => ({
    provisions: [
      ControllerP,
      { provide: StateControllerI, withProvider: ControllerP },

      { provide: ClientI, withProvider: createRedisClient },
      { provide: ConfigsI, withValue: configs },
    ],

    startHook: makeContainer({ deps: [ClientI] })(async (client: ClientI) => {
      if (!client.connected) {
        await new Promise((resolve, reject) => {
          client.once('ready', resolve);
          client.once('error', reject);
        });
      }
    }),
  }),
};

/**
 * @category Root
 */
declare namespace RedisState {
  export type Controller = ControllerP;
  export type Configs = ConfigsI;
  export type Client = ClientI;
}

export default RedisState;
