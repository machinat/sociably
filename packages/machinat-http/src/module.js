// @flow
import { createServer } from 'http';
import { inject, factory } from '@machinat/core/service';
import type { ServiceModule } from '@machinat/core/types';
import { HTTPServerI, HTTP_MODULE_CONFIGS_I } from './interface';
import HTTPConnector from './connector';
import type { HTTPModuleConfigs } from './types';

const nodeServerFactory = factory({
  lifetime: 'singleton',
})(() => createServer());

const initModule = (configsInput: HTTPModuleConfigs): ServiceModule => ({
  provisions: [
    HTTPConnector,
    { provide: HTTP_MODULE_CONFIGS_I, withValue: configsInput },
    { provide: HTTPServerI, withProvider: nodeServerFactory },
  ],
  startHook: inject({
    deps: [HTTPConnector, HTTPServerI, HTTP_MODULE_CONFIGS_I],
  })(
    (
      connector: HTTPConnector,
      server: HTTPServerI,
      configs: HTTPModuleConfigs
    ) => connector.connect(server, configs.listenOptions)
  ),
});

export default initModule;
