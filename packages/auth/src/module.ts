import type { ServiceModule } from '@machinat/core';
import { makeFactoryProvider } from '@machinat/core/service';
import Http from '@machinat/http';
import type { RequestRoute } from '@machinat/http';

import { ControllerP } from './controller';
import { ConfigsI, AuthorizerListI } from './interface';
import type { AuthConfigs, AnyServerAuthorizer } from './types';

const authRouteFactory = makeFactoryProvider({
  lifetime: 'transient',
  deps: [ControllerP, ConfigsI] as const,
})(
  (controller, configs): RequestRoute => ({
    name: 'auth',
    path: configs.entryPath || '/',
    handler: (req, res, routingInfo) => {
      controller.delegateAuthRequest(req, res, routingInfo);
    },
  })
);

/**
 * @category Root
 */
namespace Auth {
  export const Controller = ControllerP;
  export type Controller<
    Authorizer extends AnyServerAuthorizer
  > = ControllerP<Authorizer>;

  export const Configs = ConfigsI;
  export type Configs = AuthConfigs;

  export const AuthorizerList = AuthorizerListI;
  export type AuthorizerList = AuthorizerListI;

  export const initModule = (configs: AuthConfigs): ServiceModule => {
    return {
      provisions: [
        ControllerP,
        { provide: ConfigsI, withValue: configs },
        { provide: Http.RequestRouteList, withProvider: authRouteFactory },
      ],
    };
  };
}

export default Auth;
