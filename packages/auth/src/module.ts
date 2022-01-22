import type { ServiceModule } from '@machinat/core';
import { makeFactoryProvider } from '@machinat/core/service';
import Http from '@machinat/http';
import type { RequestRoute } from '@machinat/http';

import ControllerP from './AuthController';
import { ConfigsI, AuthenticatorListI } from './interface';
import type { AuthConfigs, AnyServerAuthenticator } from './types';

const authRouteFactory = makeFactoryProvider({
  lifetime: 'transient',
  deps: [ControllerP, ConfigsI],
})(
  (controller, configs): RequestRoute => ({
    name: 'auth',
    path: configs.apiPath || '/',
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
  export type Controller<Authenticator extends AnyServerAuthenticator> =
    ControllerP<Authenticator>;

  export const Configs = ConfigsI;
  export type Configs = AuthConfigs;

  export const AuthenticatorList = AuthenticatorListI;
  export type AuthenticatorList = AuthenticatorListI;

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
