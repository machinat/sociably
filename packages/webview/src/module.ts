import NextJs from 'next';
import type { SociablyPlatform } from '@sociably/core';
import {
  serviceContainer,
  serviceProviderFactory,
  ServiceProvision,
} from '@sociably/core/service';
import BaseBot from '@sociably/core/base/Bot';
import BaseMarshaler from '@sociably/core/base/Marshaler';
import Auth, { AnyServerAuthenticator } from '@sociably/auth';
import BasicAuthenticator from '@sociably/auth/basicAuth';
import Http from '@sociably/http';
import type {
  RequestRoute,
  DefaultRequestRoute,
  UpgradeRoute,
  DefaultUpgradeRoute,
} from '@sociably/http';
import Next from '@sociably/next';
import LocalOnlyBroker from '@sociably/websocket/broker/LocalOnlyBroker';
import { createWsServer } from '@sociably/websocket/utils';
import WebSocket from '@sociably/websocket';
import type {
  WebSocketJob,
  WebSocketResult,
  EventValue,
} from '@sociably/websocket';
import {
  WEBVIEW,
  DEFAULT_AUTH_PATH,
  DEFAULT_WEBSOCKET_PATH,
  DEFAULT_NEXT_PATH,
} from './constant.js';
import {
  WebviewSocketServer,
  SocketServerP,
  WebviewAuthController,
  AuthControllerP,
  AuthHttpOperatorP,
  WebviewBasicAuthenticatorP,
  NextReceiverP,
  PlatformUtilitiesI,
  ConfigsI,
} from './interface.js';
import { BotP } from './Bot.js';
import { ReceiverP } from './Receiver.js';
import WebviewConnection from './Connection.js';
import { MemoCacheTarget } from './authenticators/memo/index.js';
import type {
  WebviewEventContext,
  WebviewDispatchFrame,
  WebviewConfigs,
} from './types.js';

// HACK: NextJs type is not compatible with moduleResolution: Node16
const createNextServer = NextJs as unknown as typeof NextJs.default;

const nextServerFactory = serviceProviderFactory({
  lifetime: 'singleton',
  deps: [ConfigsI],
})(({ nextServerOptions }) =>
  createNextServer((nextServerOptions || {}) as {})
);

const wsServerFactory = serviceProviderFactory({ lifetime: 'singleton' })(
  createWsServer
);

const webSocketRouteFactory = serviceProviderFactory({
  lifetime: 'transient',
  deps: [WebSocket.Server, ConfigsI],
})(
  (server, { webSocketPath = DEFAULT_WEBSOCKET_PATH }): UpgradeRoute => ({
    name: 'websocket',
    path: webSocketPath,
    handler: (req, ns, head) => server.handleUpgrade(req, ns, head),
  })
);

const authRouteFactory = serviceProviderFactory({
  lifetime: 'transient',
  deps: [Auth.Controller, ConfigsI],
})(
  (controller, { authApiPath = DEFAULT_AUTH_PATH }): RequestRoute => ({
    name: 'auth',
    path: authApiPath,
    handler: (req, res, routingInfo) => {
      controller.delegateAuthRequest(req, res, routingInfo);
    },
  })
);

const nextRequestRouteFactory = serviceProviderFactory({
  lifetime: 'transient',
  deps: [Next.Receiver, ConfigsI],
})(
  (
    receiver,
    { webviewPath = DEFAULT_NEXT_PATH }
  ): RequestRoute | DefaultRequestRoute =>
    webviewPath === '/'
      ? {
          name: 'next',
          default: true,
          handler: receiver.handleRequestCallback(),
        }
      : {
          name: 'next',
          path: webviewPath,
          handler: receiver.handleRequestCallback(),
        }
);

const hmrRouteFactory = serviceProviderFactory({
  lifetime: 'transient',
  deps: [Next.Receiver, ConfigsI],
})(
  (
    receiver,
    { webviewPath = DEFAULT_NEXT_PATH }
  ): UpgradeRoute | DefaultUpgradeRoute =>
    webviewPath === '/'
      ? {
          name: 'webpack-hmr',
          default: true,
          handler: receiver.handleHmrUpgradeCallback(),
        }
      : {
          name: 'webpack-hmr',
          path: webviewPath,
          handler: receiver.handleHmrUpgradeCallback(),
        }
);

/**
 * @category Root
 */
namespace Webview {
  export const Configs = ConfigsI;
  export type Configs<
    Authenticator extends AnyServerAuthenticator = AnyServerAuthenticator,
    Value extends EventValue = EventValue
  > = WebviewConfigs<Authenticator, Value>;

  export const Bot = BotP;
  export type Bot = BotP;

  export const SocketServer = WebSocket.Server;
  export type SocketServer<Authenticator extends AnyServerAuthenticator> =
    WebviewSocketServer<Authenticator>;

  export const Receiver = ReceiverP;
  export type Receiver<
    Authenticator extends AnyServerAuthenticator,
    Value extends EventValue
  > = ReceiverP<Authenticator, Value>;
  export const SocketBroker = WebSocket.Broker;
  export type SocketBroker = WebSocket.Broker;

  export const SocketServerId = WebSocket.ServerId;
  export type SocketServerId = string;

  export const { WsServer } = WebSocket;
  export type WsServer = WebSocket.WsServer;

  export const AuthController = Auth.Controller;
  export type AuthController<Authenticator extends AnyServerAuthenticator> =
    WebviewAuthController<Authenticator>;

  export const { AuthenticatorList } = Auth;
  export type AuthenticatorList = Auth.AuthenticatorList;

  export const NextServer = Next.Server;
  export type NextServer = Next.Server;

  export const NextReceiver = Next.Receiver;
  export type NextReceiver = Next.Receiver;

  export const initModule = <
    Authenticator extends AnyServerAuthenticator,
    Value extends EventValue = EventValue
  >(
    configs: WebviewConfigs<Authenticator, Value>
  ): SociablyPlatform<
    WebviewEventContext<Authenticator, Value>,
    null,
    WebSocketJob,
    WebviewDispatchFrame,
    WebSocketResult
  > => {
    const provisions: ServiceProvision<unknown>[] = [
      { provide: ConfigsI, withValue: configs },

      BotP,
      {
        provide: BaseBot.PlatformMap,
        withProvider: BotP,
        platform: WEBVIEW,
      },

      { provide: WebSocket.Server, withProvider: SocketServerP },
      { provide: WebSocket.WsServer, withProvider: wsServerFactory },
      { provide: WebSocket.Broker, withProvider: LocalOnlyBroker },

      ReceiverP,
      {
        provide: Http.UpgradeRouteList,
        withProvider: webSocketRouteFactory,
      },

      { provide: BaseMarshaler.TypeList, withValue: WebviewConnection },
      { provide: BaseMarshaler.TypeList, withValue: MemoCacheTarget },

      { provide: Auth.HttpOperator, withProvider: AuthHttpOperatorP },
      { provide: Auth.Controller, withProvider: AuthControllerP },
      { provide: Http.RequestRouteList, withProvider: authRouteFactory },
    ];

    if (!configs.noNextServer) {
      provisions.push(
        NextReceiverP,
        { provide: Next.Receiver, withProvider: NextReceiverP },
        { provide: Next.Server, withProvider: nextServerFactory },
        {
          provide: Http.RequestRouteList,
          withProvider: nextRequestRouteFactory,
        }
      );
      if (configs.nextServerOptions?.dev) {
        provisions.push({
          provide: Http.UpgradeRouteList,
          withProvider: hmrRouteFactory,
        });
      }
    }

    if (configs.authPlatforms) {
      provisions.push(
        ...configs.authPlatforms,
        ...configs.authPlatforms.map((provider) => ({
          provide: Auth.AuthenticatorList,
          withProvider: provider,
        }))
      );
    }

    if (configs.basicAuth) {
      provisions.push({
        provide: BasicAuthenticator,
        withProvider: WebviewBasicAuthenticatorP,
      });
    }

    return {
      name: WEBVIEW,
      utilitiesInterface: PlatformUtilitiesI,
      eventMiddlewares: configs.eventMiddlewares,
      dispatchMiddlewares: configs.dispatchMiddlewares,
      provisions,

      startHook: serviceContainer({
        deps: [BotP, { require: NextReceiverP, optional: true }],
      })(async (bot, nextReceiver) => {
        await Promise.all([bot.start(), nextReceiver?.prepare()]);
      }),
      stopHook: serviceContainer({
        deps: [BotP, { require: NextReceiverP, optional: true }],
      })(async (bot, nextReceiver) => {
        await Promise.all([bot.stop(), nextReceiver?.close()]);
      }),
    };
  };
}

export default Webview;
