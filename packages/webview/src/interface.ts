import type Ws from 'ws';
import { makeInterface, makeClassProvider } from '@machinat/core/service';
import { ServiceProvider } from '@machinat/core/service/types';
import { AuthController } from '@machinat/auth';
import type {
  AnyServerAuthorizer,
  UserOfAuthorizer,
  ContextOfAuthorizer,
} from '@machinat/auth/types';
import { NextReceiver } from '@machinat/next';
import type { NextServer } from '@machinat/next/types';
import WebSocket, { WebSocketServer } from '@machinat/websocket';
import { useAuthController, verifyOrigin } from './utils';
import { DEFAULT_AUTH_PATH } from './constant';
import type { WebviewConfigs, WebviewPlatformMounter } from './types';

export const ConfigsI = makeInterface<WebviewConfigs<AnyServerAuthorizer>>({
  name: 'WebviewConfigsI',
});

export type ConfigsI = WebviewConfigs<AnyServerAuthorizer>;

// auth interfaces

export const AuthorizerList = makeInterface<AnyServerAuthorizer>({
  name: 'WebviewAuthorizersListI',
  multi: true,
});

export type AuthorizerList = AnyServerAuthorizer[];

export class WebviewAuthController<
  Authorizer extends AnyServerAuthorizer
> extends AuthController<Authorizer> {}

export const AuthControllerP: ServiceProvider<
  AuthController<AnyServerAuthorizer>,
  [AuthorizerList, ConfigsI]
> = makeClassProvider({
  lifetime: 'singleton',
  deps: [AuthorizerList, ConfigsI] as const,
  factory: (
    authorizers,
    {
      authSecret,
      authApiPath,
      authRedirectUrl,
      webviewHost,
      webviewPath,
      ...otherOptions
    }
  ) => {
    if (authorizers.length === 0) {
      throw new Error('Webview.AuthorizersList is empty');
    }

    return new WebviewAuthController(authorizers, {
      ...otherOptions,
      secret: authSecret,
      entryPath: authApiPath || DEFAULT_AUTH_PATH,
      redirectUrl:
        authRedirectUrl || `https://${webviewHost}/${webviewPath || ''}`,
    });
  },
})(WebviewAuthController);

export type AuthControllerP<
  Authorizer extends AnyServerAuthorizer
> = WebviewAuthController<Authorizer>;

// nextjs interfaces

export const NextServerI = makeInterface<NextServer>({
  name: 'WebviewNextServerI',
});

export type NextServerI = NextServer;

export class WebviewNextReceiver extends NextReceiver {}

export const NextReceiverP: ServiceProvider<
  NextReceiver,
  [NextServerI, ConfigsI]
> = makeClassProvider({
  lifetime: 'singleton',
  deps: [NextServerI, ConfigsI] as const,
  factory: (server, { noPrepareNext, webviewPath }) =>
    new WebviewNextReceiver(
      server,
      {
        entryPath: webviewPath,
        noPrepare: noPrepareNext,
      },
      null,
      null
    ),
})(WebviewNextReceiver);

export type NextReceiverP = WebviewNextReceiver;

// websocket interfaces

export const SocketServerIdI = makeInterface<string>({
  name: 'WebviewSocketServerIdI',
});

export const WsServerI = makeInterface<Ws.Server>({
  name: 'WebviewWsServerI',
});

export type WsServerI = Ws.Server;

export const SocketBrokerI = makeInterface<WebSocket.BrokerI>({
  name: 'WebviewSocketBrokerI',
});

export type SocketBrokerI = WebSocket.BrokerI;

export class WebviewSocketServer<
  Authorizer extends AnyServerAuthorizer
> extends WebSocketServer<
  UserOfAuthorizer<Authorizer>,
  ContextOfAuthorizer<Authorizer>
> {}

export const SocketServerP: ServiceProvider<
  WebSocketServer<
    UserOfAuthorizer<AnyServerAuthorizer>,
    ContextOfAuthorizer<AnyServerAuthorizer>
  >,
  [
    null | string,
    WsServerI,
    SocketBrokerI,
    AuthController<AnyServerAuthorizer>,
    ConfigsI
  ]
> = makeClassProvider({
  lifetime: 'singleton',
  deps: [
    { require: SocketServerIdI, optional: true },
    WsServerI,
    SocketBrokerI,
    AuthControllerP,
    ConfigsI,
  ] as const,
  factory: (
    serverId,
    wsServer,
    broker,
    authController,
    { webviewHost, heartbeatInterval }
  ) =>
    new WebviewSocketServer(
      serverId || undefined,
      wsServer,
      broker,
      ({ headers }) =>
        !!headers.origin && verifyOrigin(headers.origin, webviewHost),
      useAuthController(authController),
      { heartbeatInterval }
    ),
})(WebviewSocketServer);

export type SocketServerP<
  Authorizer extends AnyServerAuthorizer
> = WebviewSocketServer<Authorizer>;

export const PlatformMounterI = makeInterface<
  WebviewPlatformMounter<AnyServerAuthorizer>
>({
  name: 'WebviewPlatformMounterI',
});
