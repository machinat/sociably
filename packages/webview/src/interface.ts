import type Ws from 'ws';
import {
  makeInterface,
  makeClassProvider,
  ServiceProvider,
} from '@machinat/core/service';
import Marshaler from '@machinat/core/base/Marshaler';
import { AuthController } from '@machinat/auth';
import type {
  AnyServerAuthenticator,
  UserOfAuthenticator,
  ContextOfAuthenticator,
} from '@machinat/auth';
import { NextReceiver } from '@machinat/next';
import type { NextServer } from '@machinat/next';
import WebSocket, { WebSocketServer } from '@machinat/websocket';
import { useAuthLogin, verifyOrigin } from './utils';
import { DEFAULT_AUTH_PATH, DEFAULT_NEXT_PATH } from './constant';
import type { WebviewConfigs, WebviewPlatformUtilities } from './types';

export const ConfigsI = makeInterface<WebviewConfigs<AnyServerAuthenticator>>({
  name: 'WebviewConfigs',
});

export type ConfigsI = WebviewConfigs<AnyServerAuthenticator>;

// auth interfaces

export const AuthenticatorListI = makeInterface<AnyServerAuthenticator>({
  name: 'WebviewAuthenticatorsList',
  multi: true,
});

export type AuthenticatorListI = AnyServerAuthenticator[];

export class WebviewAuthController<
  Authenticator extends AnyServerAuthenticator
> extends AuthController<Authenticator> {}

export const AuthControllerP: ServiceProvider<
  AuthController<AnyServerAuthenticator>,
  [AuthenticatorListI, ConfigsI]
> = makeClassProvider({
  lifetime: 'singleton',
  deps: [AuthenticatorListI, ConfigsI],
  factory: (
    authenticators,
    {
      authSecret,
      authApiPath = DEFAULT_AUTH_PATH,
      webviewHost,
      webviewPath = DEFAULT_NEXT_PATH,
      ...otherOptions
    }
  ) => {
    if (authenticators.length === 0) {
      throw new Error('Webview.AuthenticatorsList is empty');
    }

    return new WebviewAuthController(authenticators, {
      ...otherOptions,
      serverUrl: `https://${webviewHost}`,
      secret: authSecret,
      apiPath: authApiPath,
      redirectEntry: webviewPath,
    });
  },
})(WebviewAuthController);

export type AuthControllerP<Authenticator extends AnyServerAuthenticator> =
  WebviewAuthController<Authenticator>;

// next interfaces

export const NextServerI = makeInterface<NextServer>({
  name: 'WebviewNextServer',
});

export type NextServerI = NextServer;

export class WebviewNextReceiver extends NextReceiver {}

export const NextReceiverP: ServiceProvider<
  NextReceiver,
  [NextServerI, ConfigsI]
> = makeClassProvider({
  lifetime: 'singleton',
  deps: [NextServerI, ConfigsI],
  factory: (server, { noPrepareNext, webviewPath = DEFAULT_NEXT_PATH }) =>
    new WebviewNextReceiver(server, {
      entryPath: webviewPath,
      noPrepare: noPrepareNext,
    }),
})(WebviewNextReceiver);

export type NextReceiverP = WebviewNextReceiver;

// websocket interfaces

export const SocketServerIdI = makeInterface<string>({
  name: 'WebviewSocketServerId',
});

export const WsServerI = makeInterface<Ws.Server>({
  name: 'WebviewWsServer',
});

export type WsServerI = Ws.Server;

export const SocketBrokerI = makeInterface<WebSocket.Broker>({
  name: 'WebviewSocketBroker',
});

export type SocketBrokerI = WebSocket.Broker;

export class WebviewSocketServer<
  Authenticator extends AnyServerAuthenticator
> extends WebSocketServer<
  UserOfAuthenticator<Authenticator>,
  ContextOfAuthenticator<Authenticator>
> {}

export const SocketServerP: ServiceProvider<
  WebSocketServer<
    UserOfAuthenticator<AnyServerAuthenticator>,
    ContextOfAuthenticator<AnyServerAuthenticator>
  >,
  [
    null | string,
    WsServerI,
    SocketBrokerI,
    AuthController<AnyServerAuthenticator>,
    Marshaler,
    ConfigsI
  ]
> = makeClassProvider({
  lifetime: 'singleton',
  deps: [
    { require: SocketServerIdI, optional: true },
    WsServerI,
    SocketBrokerI,
    AuthControllerP,
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

export type SocketServerP<Authenticator extends AnyServerAuthenticator> =
  WebviewSocketServer<Authenticator>;

export const PlatformUtilitiesI = makeInterface<
  WebviewPlatformUtilities<AnyServerAuthenticator>
>({
  name: 'WebviewPlatformUtilities',
});
