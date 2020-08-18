import type { ServiceModule } from '@machinat/core/types';
import { factory } from '@machinat/core/service';

import HTTP from '@machinat/http';
import type { HTTPRequestRouting } from '@machinat/http/types';

import ServerController from './server';
import { MODULE_CONFIGS_I, SERVER_AUTHORIZERS_I } from './constant';
import type { AuthModuleConfigs } from './types';

const authRoutingFactory = factory<HTTPRequestRouting>({
  lifetime: 'transient',
  deps: [ServerController, MODULE_CONFIGS_I],
})((controller: ServerController, configs: AuthModuleConfigs) => ({
  name: 'auth',
  path: configs.entryPath || '/',
  handler: (req, res) => {
    controller.delegateAuthRequest(req, res);
  },
}));

const Auth = {
  Controller: ServerController,
  CONFIGS_I: MODULE_CONFIGS_I,
  AUTHORIZERS_I: SERVER_AUTHORIZERS_I,

  initModule: (configs: AuthModuleConfigs): ServiceModule => ({
    provisions: [
      ServerController,
      { provide: MODULE_CONFIGS_I, withValue: configs },
      { provide: HTTP.REQUEST_ROUTINGS_I, withProvider: authRoutingFactory },
    ],
  }),
};

declare namespace Auth {
  export type Controller = ServerController;
}

export default Auth;
