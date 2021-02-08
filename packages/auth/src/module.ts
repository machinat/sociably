import type { ServiceModule } from '@machinat/core/types';
import { makeFactoryProvider } from '@machinat/core/service';
import Http from '@machinat/http';
import type { RequestRoute } from '@machinat/http/types';

import { ControllerP } from './controller';
import {
  ConfigsI as AuthConfigsI,
  AuthorizerList as AuthAuthorizerList,
} from './interface';
import type { AuthConfigs, AnyServerAuthorizer } from './types';

/** @internal */
const authRouteFactory = makeFactoryProvider({
  lifetime: 'transient',
  deps: [ControllerP, AuthConfigsI] as const,
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
const Auth = {
  Controller: ControllerP,
  ConfigsI: AuthConfigsI,
  AuthorizerList: AuthAuthorizerList,

  initModule: (configs: AuthConfigs): ServiceModule => {
    return {
      provisions: [
        ControllerP,
        { provide: AuthConfigsI, withValue: configs },
        { provide: Http.RequestRouteList, withProvider: authRouteFactory },
      ],
    };
  },
};

/**
 * @category Root
 */
declare namespace Auth {
  export type Controller<Authorizer extends AnyServerAuthorizer> = ControllerP<
    Authorizer
  >;
  export type ConfigsI = AuthConfigsI;
  export type AuthorizerList = AuthAuthorizerList;
}

export default Auth;
