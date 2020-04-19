// @flow
import { factory } from '@machinat/core/service';
import HTTP from '@machinat/http';
import type { HTTPRequestRouting } from '@machinat/http/types';
import AuthServerController from './server';
import { AUTH_MODULE_CONFIGS_I, AUTH_SERVER_AUTHORIZERS_I } from './constant';
import type { AuthModuleConfigs } from './types';

const authRoutingFactory = factory<HTTPRequestRouting>({
  lifetime: 'transient',
  deps: [AuthServerController, AUTH_MODULE_CONFIGS_I],
})((controller: AuthServerController, configs: AuthModuleConfigs) => ({
  name: 'auth',
  path: configs.entryPath || '/',
  handler: (req, res) => {
    controller.delegateAuthRequest(req, res);
  },
}));

const Auth = {
  Controller: AuthServerController,
  CONFIGS_I: AUTH_MODULE_CONFIGS_I,
  AUTHORIZERS_I: AUTH_SERVER_AUTHORIZERS_I,

  initModule: (configs: AuthModuleConfigs) => ({
    provisions: [
      AuthServerController,
      { provide: AUTH_MODULE_CONFIGS_I, withValue: configs },
      { provide: HTTP.REQUEST_ROUTINGS_I, withProvider: authRoutingFactory },
    ],
  }),
};

export default Auth;
