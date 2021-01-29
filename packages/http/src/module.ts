import { createServer } from 'http';
import { makeContainer, makeFactoryProvider } from '@machinat/core/service';
import { ServiceModule } from '@machinat/core/types';
import {
  HttpServerI,
  MODULE_CONFIGS_I,
  REQUEST_ROUTES_I,
  UPGRADE_ROUTES_I,
} from './interface';
import { ConnectorP } from './connector';
import { HttpModuleConfigs } from './types';

/** @internal */
const httpServerFactory = makeFactoryProvider({
  lifetime: 'singleton',
})(() => createServer());

const Http = {
  CONFIGS_I: MODULE_CONFIGS_I,
  REQUEST_ROUTES_I,
  UPGRADE_ROUTES_I,
  ServerI: HttpServerI,
  Connector: ConnectorP,

  initModule: (configsInput: HttpModuleConfigs): ServiceModule => ({
    provisions: [
      ConnectorP,
      { provide: MODULE_CONFIGS_I, withValue: configsInput },
      { provide: HttpServerI, withProvider: httpServerFactory },
    ],
    startHook: makeContainer({
      deps: [ConnectorP, HttpServerI, MODULE_CONFIGS_I] as const,
    })((connector, server, { listenOptions }) =>
      connector.connect(server, listenOptions)
    ),
  }),
};

declare namespace Http {
  export type Connector = ConnectorP;
  export type ServerI = HttpServerI;
}

export default Http;
