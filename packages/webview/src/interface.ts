import type WS from 'ws';
import { makeInterface, makeClassProvider } from '@machinat/core/service';
import { AuthController } from '@machinat/auth';
import type {
  AnyServerAuthorizer,
  UserOfAuthorizer,
  ContextOfAuthorizer,
} from '@machinat/auth/types';
import { NextReceiver } from '@machinat/next';
import type { NextServer } from '@machinat/next/types';
import WebSocket, { WebSocketServer } from '@machinat/websocket';
import { useAuthController } from './utils';
import { DEFAULT_AUTH_ROUTE, DEFAULT_NEXT_ROUTE } from './constant';
import type { WebviewPlatformConfigs, WebviewPlatformMounter } from './types';

export const PLATFORM_CONFIGS_I = makeInterface<WebviewPlatformConfigs<never>>({
  name: 'WebviewPlatformConfigsI',
});

// auth interfaces

export const AUTHORIZERS_I = makeInterface<AnyServerAuthorizer>({
  name: 'WebviewAuthorizersListI',
  multi: true,
});

export class WebviewAuthController<
  Authorizer extends AnyServerAuthorizer
> extends AuthController<Authorizer> {}

export const AuthControllerP = makeClassProvider({
  lifetime: 'singleton',
  deps: [AUTHORIZERS_I, PLATFORM_CONFIGS_I] as const,
  factory: (authorizers, { authPath, ...otherOptions }) =>
    new WebviewAuthController(authorizers, {
      ...otherOptions,
      entryPath: authPath || DEFAULT_AUTH_ROUTE,
    }),
})(WebviewAuthController);

export type AuthControllerP<
  Authorizer extends AnyServerAuthorizer
> = WebviewAuthController<Authorizer>;

// nextjs interfaces

export const NEXT_SERVER_I = makeInterface<NextServer>({
  name: 'WebviewNextServerI',
});

export class WebviewNextReceiver extends NextReceiver {}

export const NextReceiverP = makeClassProvider({
  lifetime: 'singleton',
  deps: [NEXT_SERVER_I, PLATFORM_CONFIGS_I] as const,
  factory: (server, { noPrepareNext, nextPath }) =>
    new WebviewNextReceiver(
      server,
      {
        entryPath: nextPath || DEFAULT_NEXT_ROUTE,
        noPrepare: noPrepareNext,
      },
      null,
      null
    ),
})(WebviewNextReceiver);

export type NextReceiverP = WebviewNextReceiver;

// websocket interfaces

export const SOCKET_SERVER_ID_I = makeInterface<string>({
  name: 'WebviewSocketServerIdI',
});

export const WS_SERVER_I = makeInterface<WS.Server>({
  name: 'WebviewWSServerI',
});

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

export const SocketServerP = makeClassProvider({
  lifetime: 'singleton',
  deps: [
    SOCKET_SERVER_ID_I,
    WS_SERVER_I,
    SocketBrokerI,
    AuthControllerP,
    PLATFORM_CONFIGS_I,
  ] as const,
  factory: (
    serverId,
    wsServer,
    broker,
    authController,
    { origin, heartbeatInterval }
  ) =>
    new WebviewSocketServer(
      serverId,
      wsServer,
      broker,
      ({ headers }) => headers.origin === origin,
      useAuthController(authController),
      heartbeatInterval
    ),
})(WebviewSocketServer);

export type SocketServerP<
  Authorizer extends AnyServerAuthorizer
> = WebviewSocketServer<Authorizer>;

export const PLATFORM_MOUNTER_I = makeInterface<
  WebviewPlatformMounter<AnyServerAuthorizer>
>({
  name: 'WebviewPlatformMounterI',
});
