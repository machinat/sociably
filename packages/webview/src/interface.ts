import { join as joinPath } from 'path';
import { Marshaler, StateController } from '@sociably/core';
import ModuleUtilities from '@sociably/core/base/ModuleUtilities';
import { serviceInterface, serviceProviderClass } from '@sociably/core/service';
import Http from '@sociably/http';
import Auth, { AuthController, AuthHttpOperator } from '@sociably/auth';
import type {
  AnyServerAuthenticator,
  UserOfAuthenticator,
  ContextOfAuthenticator,
} from '@sociably/auth';
import { BasicAuthenticator } from '@sociably/auth/basicAuth';
import Next, { NextReceiver } from '@sociably/next';
import WebSocket, { WebSocketServer } from '@sociably/websocket';
import useAuthLogin from './utils/useAuthLogin.js';
import verifyOrigin from './utils/verifyOrigin.js';
import { DEFAULT_AUTH_ROUTE } from './constant.js';
import type { WebviewConfigs, WebviewPlatformUtilities } from './types.js';

export const ConfigsI = serviceInterface<WebviewConfigs>({
  name: 'WebviewConfigs',
});

export const PlatformUtilitiesI = serviceInterface<
  WebviewPlatformUtilities<AnyServerAuthenticator>
>({
  name: 'WebviewPlatformUtilities',
});

// auth
export class WebviewAuthController<
  Authenticator extends AnyServerAuthenticator
> extends AuthController<Authenticator> {}

export const AuthControllerP = serviceProviderClass({
  lifetime: 'singleton',
  deps: [Auth.HttpOperator, Auth.AuthenticatorList],
  factory: (operator, authenticators) => {
    if (authenticators.length === 0) {
      throw new Error('Webview.AuthenticatorsList is empty');
    }

    return new WebviewAuthController(operator, authenticators);
  },
})(WebviewAuthController);

export class WebviewAuthHttpOperator extends AuthHttpOperator {}

export const AuthHttpOperatorP = serviceProviderClass({
  lifetime: 'singleton',
  deps: [ConfigsI, Http.Configs],
  factory: (
    {
      authSecret,
      authApiPath = DEFAULT_AUTH_ROUTE,
      webviewPath,
      ...otherOptions
    },
    { entryUrl }
  ) => {
    return new AuthHttpOperator({
      ...otherOptions,
      serverUrl: entryUrl,
      secret: authSecret,
      apiPath: authApiPath,
      // NOTE: set redirectUrl to the root pages directory
      redirectUrl: joinPath(webviewPath ?? '.', '/'),
    });
  },
})(WebviewAuthHttpOperator);

export class WebviewBasicServerAuthenticator extends BasicAuthenticator {}

export const WebviewBasicAuthenticatorP = serviceProviderClass({
  lifetime: 'singleton',
  deps: [StateController, Auth.HttpOperator, ConfigsI],
  factory: (stateController, httpOperator, configs) => {
    return new WebviewBasicServerAuthenticator(stateController, httpOperator, {
      ...configs.basicAuth,
      loginDuration:
        configs.basicAuth?.loginDuration || configs.dataCookieMaxAge,
    });
  },
})(WebviewBasicServerAuthenticator);

// next interfaces

export class WebviewNextReceiver extends NextReceiver {}

export const NextReceiverP = serviceProviderClass({
  lifetime: 'singleton',
  deps: [Next.Server, ConfigsI, ModuleUtilities],
  factory: (
    server,
    { noPrepareNext, nextRequestHandler },
    { initScope, popError }
  ) =>
    new WebviewNextReceiver(server, {
      noPrepare: noPrepareNext,
      handleRequest: nextRequestHandler,
      initScope,
      popError,
    }),
})(WebviewNextReceiver);

// websocket interfaces

export class WebviewSocketServer<
  Authenticator extends AnyServerAuthenticator
> extends WebSocketServer<
  UserOfAuthenticator<Authenticator>,
  ContextOfAuthenticator<Authenticator>
> {}

export const SocketServerP = serviceProviderClass({
  lifetime: 'singleton',
  deps: [
    { require: WebSocket.ServerId, optional: true },
    WebSocket.WsServer,
    WebSocket.Broker,
    Auth.Controller,
    Marshaler,
    ConfigsI,
    Http.Configs,
  ],
  factory: (
    serverId,
    wsServer,
    broker,
    authController,
    marshaler,
    { secure = true, heartbeatInterval },
    { entryUrl }
  ) => {
    const serverHost = new URL(entryUrl).host;
    return new WebviewSocketServer({
      id: serverId || undefined,
      wsServer,
      broker,
      marshaler,
      verifyUpgrade: ({ headers }) =>
        !!headers.origin && verifyOrigin(secure, headers.origin, serverHost),
      verifyLogin: useAuthLogin(authController),
      heartbeatInterval,
    });
  },
})(WebviewSocketServer);
