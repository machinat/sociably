import { createServer } from 'http';
import { container, factory } from '@machinat/core/service';
import { ServiceModule } from '@machinat/core/types';
import {
  HTTPServerI,
  MODULE_CONFIGS_I,
  REQUEST_ROUTINGS_I,
  UPGRADE_ROUTINGS_I,
} from './interface';
import { ConnectorP } from './connector';
import { HTTPModuleConfigs } from './types';

/** @internal */
const nodeServerFactory = factory({
  lifetime: 'singleton',
})(() => createServer());

const HTTP = {
  CONFIGS_I: MODULE_CONFIGS_I,
  REQUEST_ROUTINGS_I,
  UPGRADE_ROUTINGS_I,
  ServerI: HTTPServerI,
  Connector: ConnectorP,

  initModule: (configsInput: HTTPModuleConfigs): ServiceModule => ({
    provisions: [
      ConnectorP,
      { provide: MODULE_CONFIGS_I, withValue: configsInput },
      { provide: HTTPServerI, withProvider: nodeServerFactory },
    ],
    startHook: container<Promise<void>>({
      deps: [ConnectorP, HTTPServerI, MODULE_CONFIGS_I],
    })(
      (
        connector: ConnectorP,
        server: HTTPServerI,
        configs: HTTPModuleConfigs
      ) => connector.connect(server, configs)
    ),
  }),
};

declare namespace HTTP {
  export type Connector = ConnectorP;
  export type ServerI = HTTPServerI;
}

export default HTTP;
