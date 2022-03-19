import { Marshaler, StateController } from '@machinat/core';
import { makeInterface, makeClassProvider } from '@machinat/core/service';
import Auth, { AuthController, AuthHttpOperator } from '@machinat/auth';
import type {
  AnyServerAuthenticator,
  UserOfAuthenticator,
  ContextOfAuthenticator,
} from '@machinat/auth';
import { BasicServerAuthenticator } from '@machinat/auth/basicAuth';
import Next, { NextReceiver } from '@machinat/next';
import WebSocket, { WebSocketServer } from '@machinat/websocket';
import { useAuthLogin, verifyOrigin } from './utils';
import { DEFAULT_AUTH_PATH, DEFAULT_NEXT_PATH } from './constant';
import type { WebviewConfigs, WebviewPlatformUtilities } from './types';

export const ConfigsI = makeInterface<WebviewConfigs<AnyServerAuthenticator>>({
  name: 'WebviewConfigs',
});

export type ConfigsI = WebviewConfigs<AnyServerAuthenticator>;

// auth
export class WebviewAuthController<
  Authenticator extends AnyServerAuthenticator
> extends AuthController<Authenticator> {}

export const AuthControllerP = makeClassProvider({
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

export const AuthHttpOperatorP = makeClassProvider({
  lifetime: 'singleton',
  deps: [ConfigsI],
  factory: ({
    authSecret,
    authApiPath = DEFAULT_AUTH_PATH,
    webviewHost,
    webviewPath = DEFAULT_NEXT_PATH,
    ...otherOptions
  }) => {
    return new AuthHttpOperator({
      ...otherOptions,
      serverUrl: `https://${webviewHost}`,
      secret: authSecret,
      apiRoot: authApiPath,
      redirectRoot: webviewPath,
    });
  },
})(WebviewAuthHttpOperator);

export class WebviewBasicServerAuthenticator extends BasicServerAuthenticator {}

export const WebviewBasicAuthenticatorP = makeClassProvider({
  lifetime: 'singleton',
  deps: [StateController, Auth.HttpOperator, ConfigsI],
  factory: (stateController, httpOperator, { basicAuth }) => {
    return new WebviewBasicServerAuthenticator(
      stateController,
      httpOperator,
      basicAuth
    );
  },
})(WebviewBasicServerAuthenticator);

// next interfaces

export class WebviewNextReceiver extends NextReceiver {}

export const NextReceiverP = makeClassProvider({
  lifetime: 'singleton',
  deps: [Next.Server, ConfigsI],
  factory: (server, { noPrepareNext, webviewPath = DEFAULT_NEXT_PATH }) =>
    new WebviewNextReceiver(server, {
      entryPath: webviewPath,
      noPrepare: noPrepareNext,
    }),
})(WebviewNextReceiver);

// websocket interfaces

export class WebviewSocketServer<
  Authenticator extends AnyServerAuthenticator
> extends WebSocketServer<
  UserOfAuthenticator<Authenticator>,
  ContextOfAuthenticator<Authenticator>
> {}

export const SocketServerP = makeClassProvider({
  lifetime: 'singleton',
  deps: [
    { require: WebSocket.ServerId, optional: true },
    WebSocket.WsServer,
    WebSocket.Broker,
    Auth.Controller,
    Marshaler,
    ConfigsI,
  ],
  factory: (
    serverId,
    wsServer,
    broker,
    authController,
    marshaler,
    { webviewHost, heartbeatInterval }
  ) =>
    new WebviewSocketServer({
      id: serverId || undefined,
      wsServer,
      broker,
      marshaler,
      verifyUpgrade: ({ headers }) =>
        !!headers.origin && verifyOrigin(headers.origin, webviewHost),
      verifyLogin: useAuthLogin(authController),
      heartbeatInterval,
    }),
})(WebviewSocketServer);

export const PlatformUtilitiesI = makeInterface<
  WebviewPlatformUtilities<AnyServerAuthenticator>
>({
  name: 'WebviewPlatformUtilities',
});
