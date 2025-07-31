import Pg from 'pg';
import type { ServiceModule } from '@sociably/core';
import { serviceProviderFactory } from '@sociably/core/service';
import StateRepositoryI from '@sociably/core/base/StateRepository';

import { RepositoryP } from './PostgresStateRepository.js';
import { ConfigsI, ConnectionPoolI } from './interface.js';

const initConnectionPool = serviceProviderFactory({
  lifetime: 'singleton',
  deps: [ConfigsI],
})(({ connectOptions }) => new Pg.Pool(connectOptions));

/** @category Root */
namespace PostgresState {
  export const Controller = RepositoryP;
  export type Controller = RepositoryP;

  export const ConnectionPool = ConnectionPoolI;
  export type ConnectionPool = ConnectionPoolI;

  export const Configs = ConfigsI;
  export type Configs = ConfigsI;

  export const initModule = (configs: ConfigsI): ServiceModule => ({
    provisions: [
      RepositoryP,
      { provide: StateRepositoryI, withProvider: RepositoryP },
      { provide: ConnectionPoolI, withProvider: initConnectionPool },
      { provide: ConfigsI, withValue: configs },
    ],
  });
}

export default PostgresState;
