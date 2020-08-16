import { createServer } from 'http';
import { container, factory } from '@machinat/core/service';
import { ServiceModule } from '@machinat/core/types';
import {
  HTTPServerI,
  HTTP_MODULE_CONFIGS_I,
  HTTP_REQUEST_ROUTINGS_I,
  HTTP_UPGRADE_ROUTINGS_I,
} from './interface';
import HTTPConnector from './connector';
import { HTTPModuleConfigs } from './types';

const nodeServerFactory = factory({
  lifetime: 'singleton',
})(() => createServer());

const HTTP = {
  CONFIGS_I: HTTP_MODULE_CONFIGS_I,
  REQUEST_ROUTINGS_I: HTTP_REQUEST_ROUTINGS_I,
  UPGRADE_ROUTINGS_I: HTTP_UPGRADE_ROUTINGS_I,
  ServerI: HTTPServerI,
  Connector: HTTPConnector,

  initModule: (configsInput: HTTPModuleConfigs): ServiceModule => ({
    provisions: [
      HTTPConnector,
      { provide: HTTP_MODULE_CONFIGS_I, withValue: configsInput },
      { provide: HTTPServerI, withProvider: nodeServerFactory },
    ],
    startHook: container<Promise<void>>({
      deps: [HTTPConnector, HTTPServerI, HTTP_MODULE_CONFIGS_I],
    })(
      (
        connector: HTTPConnector,
        server: HTTPServerI,
        configs: HTTPModuleConfigs
      ) => connector.connect(server, configs)
    ),
  }),
};

export default HTTP;
