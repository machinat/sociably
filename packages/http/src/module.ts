import { createServer } from 'http';
import { makeContainer, makeFactoryProvider } from '@machinat/core/service';
import { ServiceModule } from '@machinat/core/types';
import {
  HttpServerI,
  MODULE_CONFIGS_I,
  REQUEST_ROUTINGS_I,
  UPGRADE_ROUTINGS_I,
} from './interface';
import { ConnectorP } from './connector';
import { HttpModuleConfigs } from './types';

/** @internal */
const nodeServerFactory = makeFactoryProvider({
  lifetime: 'singleton',
})(() => createServer());

const Http = {
  CONFIGS_I: MODULE_CONFIGS_I,
  REQUEST_ROUTINGS_I,
  UPGRADE_ROUTINGS_I,
  ServerI: HttpServerI,
  Connector: ConnectorP,

  initModule: (configsInput: HttpModuleConfigs): ServiceModule => ({
    provisions: [
      ConnectorP,
      { provide: MODULE_CONFIGS_I, withValue: configsInput },
      { provide: HttpServerI, withProvider: nodeServerFactory },
    ],
    startHook: makeContainer({
      deps: [ConnectorP, HttpServerI, MODULE_CONFIGS_I] as const,
    })((connector, server, configs) => connector.connect(server, configs)),
  }),
};

declare namespace Http {
  export type Connector = ConnectorP;
  export type ServerI = HttpServerI;
}

export default Http;
