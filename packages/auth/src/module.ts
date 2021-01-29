import type { ServiceModule } from '@machinat/core/types';
import { makeFactoryProvider } from '@machinat/core/service';
import Http from '@machinat/http';
import type { RequestRoute } from '@machinat/http/types';

import { ControllerP } from './controller';
import { MODULE_CONFIGS_I, AUTHORIZERS_I } from './interface';
import type { AuthModuleConfigs, AnyServerAuthorizer } from './types';

/** @internal */
const authRoutingFactory = makeFactoryProvider({
  lifetime: 'transient',
  deps: [ControllerP, MODULE_CONFIGS_I] as const,
})(
  (controller, configs): RequestRoute => ({
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
      { provide: Http.REQUEST_ROUTES_I, withProvider: authRoutingFactory },
    ],
  }),
};

declare namespace Auth {
  export type Controller<Authorizer extends AnyServerAuthorizer> = ControllerP<
    Authorizer
  >;
}

export default Auth;
