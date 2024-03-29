import Pg from 'pg';
import type { ServiceModule } from '@sociably/core';
import { serviceProviderFactory } from '@sociably/core/service';
import StateControllerI from '@sociably/core/base/StateController';

import { ControllerP } from './Controller.js';
import { ConfigsI, ConnectionPoolI } from './interface.js';

const initConnectionPool = serviceProviderFactory({
  lifetime: 'singleton',
  deps: [ConfigsI],
})(({ connectOptions }) => new Pg.Pool(connectOptions));

/**
 * @category Root
 */
namespace PostgresState {
  export const Controller = ControllerP;
  export type Controller = ControllerP;

  export const ConnectionPool = ConnectionPoolI;
  export type ConnectionPool = ConnectionPoolI;

  export const Configs = ConfigsI;
  export type Configs = ConfigsI;

  export const initModule = (configs: ConfigsI): ServiceModule => ({
    provisions: [
      ControllerP,
      { provide: StateControllerI, withProvider: ControllerP },
      { provide: ConnectionPoolI, withProvider: initConnectionPool },
      { provide: ConfigsI, withValue: configs },
    ],
  });
}

export default PostgresState;
