import { createServer } from 'http';
import { container, factory } from '@machinat/core/service';
import { ServiceModule } from '@machinat/core/types';
import {
  ServerI,
  HTTPServer,
  MODULE_CONFIGS_I,
  REQUEST_ROUTINGS_I,
  UPGRADE_ROUTINGS_I,
} from './interface';
import ConnectorP, { HTTPConnector } from './connector';
import { HTTPModuleConfigs } from './types';

const nodeServerFactory = factory({
  lifetime: 'singleton',
})(() => createServer());

const HTTP = {
  CONFIGS_I: MODULE_CONFIGS_I,
  REQUEST_ROUTINGS_I,
  UPGRADE_ROUTINGS_I,
  ServerI,
  Connector: ConnectorP,

  initModule: (configsInput: HTTPModuleConfigs): ServiceModule => ({
    provisions: [
      ConnectorP,
      { provide: MODULE_CONFIGS_I, withValue: configsInput },
      { provide: ServerI, withProvider: nodeServerFactory },
    ],
    startHook: container<Promise<void>>({
      deps: [ConnectorP, ServerI, MODULE_CONFIGS_I],
    })(
      (
        connector: HTTPConnector,
        server: HTTPServer,
        configs: HTTPModuleConfigs
      ) => connector.connect(server, configs)
    ),
  }),
};

declare namespace HTTP {
  export type Connector = HTTPConnector;
  export type ServerI = HTTPServer;
}

export default HTTP;
