import type { ServiceModule } from '@machinat/core/types';
import { makeFactoryProvider } from '@machinat/core/service';
import HTTP from '@machinat/http';
import type { HTTPRequestRouting } from '@machinat/http/types';

import { ControllerP } from './controller';
import { MODULE_CONFIGS_I, AUTHORIZERS_I } from './interface';
import type { AuthModuleConfigs, ServerAuthorizer } from './types';

/** @internal */
const authRoutingFactory = makeFactoryProvider({
  lifetime: 'transient',
  deps: [ControllerP, MODULE_CONFIGS_I] as const,
})(
  (controller, configs): HTTPRequestRouting => ({
    name: 'auth',
    path: configs.entryPath || '/',
    handler: (req, res, routingInfo) => {
      controller.delegateAuthRequest(req, res, routingInfo);
    },
  })
);

const Auth = {
  Controller: ControllerP,
  CONFIGS_I: MODULE_CONFIGS_I,
  AUTHORIZERS_I,

  initModule: (configs: AuthModuleConfigs): ServiceModule => ({
    provisions: [
      ControllerP,
      { provide: MODULE_CONFIGS_I, withValue: configs },
      { provide: HTTP.REQUEST_ROUTINGS_I, withProvider: authRoutingFactory },
    ],
  }),
};

declare namespace Auth {
  export type Controller<
    Authorizer extends ServerAuthorizer<any, any, any, any>
  > = ControllerP<Authorizer>;
}

export default Auth;
