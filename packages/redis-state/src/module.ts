import redis from 'redis';
import type { ServiceModule } from '@sociably/core';
import {
  serviceProviderFactory,
  serviceContainer,
} from '@sociably/core/service';
import StateRepositoryI from '@sociably/core/base/StateRepository.js';

import { RepositoryP } from './RedisStateRepository.js';
import { ConfigsI, ClientI } from './interface.js';

const createRedisClient = serviceProviderFactory({
  lifetime: 'singleton',
  deps: [ConfigsI],
})(({ connectOptions }) => redis.createClient(connectOptions));

/** @category Root */
namespace RedisState {
  export const Repository = RepositoryP;
  export type Repository = RepositoryP;

  export const Client = ClientI;
  export type Client = ClientI;

  export const Configs = ConfigsI;
  export type Configs = ConfigsI;

  export const initModule = (configs: ConfigsI): ServiceModule => ({
    provisions: [
      RepositoryP,
      { provide: StateRepositoryI, withProvider: RepositoryP },

      { provide: ClientI, withProvider: createRedisClient },
      { provide: ConfigsI, withValue: configs },
    ],

    startHook: serviceContainer({ deps: [ClientI] })(
      async (client: ClientI) => {
        if (!client.connected) {
          await new Promise((resolve, reject) => {
            client.once('ready', resolve);
            client.once('error', reject);
          });
        }
      },
    ),
    stopHook: serviceContainer({ deps: [ClientI] })(async (client: ClientI) => {
      client.quit();
    }),
  });
}

export default RedisState;
