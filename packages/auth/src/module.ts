import type { ServiceModule } from '@sociably/core';
import {
  serviceProviderFactory,
  ServiceProvision,
} from '@sociably/core/service';
import Http from '@sociably/http';
import type { RequestRoute } from '@sociably/http';
import RepositoryP from './Controller.js';
import HttpOperatorP from './HttpOperator.js';
import BasicAuthenticator from './basicAuth/index.js';
import { ConfigsI, AuthenticatorListI } from './interface.js';
import type { AuthConfigs, AnyServerAuthenticator } from './types.js';

const authRouteFactory = serviceProviderFactory({
  lifetime: 'transient',
  deps: [RepositoryP, ConfigsI],
})(
  (controller, configs): RequestRoute => ({
    name: 'auth',
    path: configs.apiPath || '.',
    handler: (req, res, routingInfo) => {
      controller.handleRequest(req, res, routingInfo);
    },
  }),
);

/** @category Root */
namespace Auth {
  export const Controller = RepositoryP;
  export type Controller<Authenticator extends AnyServerAuthenticator> =
    RepositoryP<Authenticator>;
  export const HttpOperator = HttpOperatorP;
  export type HttpOperator = HttpOperatorP;

  export const Configs = ConfigsI;
  export type Configs = AuthConfigs;

  export const AuthenticatorList = AuthenticatorListI;
  export type AuthenticatorList = AuthenticatorListI;

  export const initModule = (configs: AuthConfigs): ServiceModule => {
    const provisions: ServiceProvision<unknown>[] = [
      RepositoryP,
      HttpOperatorP,
      { provide: ConfigsI, withValue: configs },
      { provide: Http.RequestRouteList, withProvider: authRouteFactory },
    ];

    if (configs.basicAuth) {
      provisions.push(BasicAuthenticator);
    }

    return { provisions };
  };
}

export default Auth;
