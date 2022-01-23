import createNextServer from 'next';
import type { MachinatPlatform } from '@machinat/core';
import {
  makeContainer,
  makeFactoryProvider,
  ServiceProvision,
} from '@machinat/core/service';
import BaseBot from '@machinat/core/base/Bot';
import BaseMarshaler from '@machinat/core/base/Marshaler';
import { AnyServerAuthenticator } from '@machinat/auth';
import Http from '@machinat/http';
import type {
  RequestRoute,
  DefaultRequestRoute,
  UpgradeRoute,
} from '@machinat/http';
import LocalOnlyBroker from '@machinat/websocket/broker/LocalOnlyBroker';
import { createWsServer } from '@machinat/websocket/utils';
import type {
  WebSocketJob,
  WebSocketResult,
  EventValue,
} from '@machinat/websocket';

import {
  WEBVIEW,
  DEFAULT_AUTH_PATH,
  DEFAULT_WEBSOCKET_PATH,
  DEFAULT_NEXT_PATH,
} from './constant';
import {
  SocketServerP,
  AuthControllerP,
  NextReceiverP,
  PlatformUtilitiesI,
  SocketServerIdI,
  ConfigsI,
  SocketBrokerI,
  WsServerI,
  AuthenticatorListI,
  NextServerI,
} from './interface';
import { BotP } from './bot';
import { ReceiverP } from './receiver';
import {
  WebviewConnection,
  WebviewUserChannel,
  WebviewTopicChannel,
} from './channel';
import { NoneUser, NoneChannel } from './noneAuthenticator';
import type {
  WebviewEventContext,
  WebviewDispatchFrame,
  WebviewConfigs,
} from './types';

const nextServerFactory = makeFactoryProvider({
  lifetime: 'singleton',
  deps: [ConfigsI],
})(({ nextServerOptions }) =>
  createNextServer((nextServerOptions || {}) as {})
);

const wsServerFactory = makeFactoryProvider({ lifetime: 'singleton' })(
  createWsServer
);

const webSocketRouteFactory = makeFactoryProvider({
  lifetime: 'transient',
  deps: [SocketServerP, ConfigsI],
})(
  (server, { webSocketPath = DEFAULT_WEBSOCKET_PATH }): UpgradeRoute => ({
    name: 'websocket',
    path: webSocketPath,
    handler: (req, ns, head) => server.handleUpgrade(req, ns, head),
  })
);

const authRouteFactory = makeFactoryProvider({
  lifetime: 'transient',
  deps: [AuthControllerP, ConfigsI],
})(
  (controller, { authApiPath = DEFAULT_AUTH_PATH }): RequestRoute => ({
    name: 'auth',
    path: authApiPath,
    handler: (req, res, routingInfo) => {
      controller.delegateAuthRequest(req, res, routingInfo);
    },
  })
);

const nextRouteFactory = makeFactoryProvider({
  lifetime: 'transient',
  deps: [NextReceiverP, ConfigsI],
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

/**
 * @category Root
 */
namespace Webview {
  export const Configs = ConfigsI;
  export type Configs = ConfigsI;

  export const Bot = BotP;
  export type Bot<Authenticator extends AnyServerAuthenticator> =
    BotP<Authenticator>;

  export const SocketServer = SocketServerP;
  export type SocketServer<Authenticator extends AnyServerAuthenticator> =
    SocketServerP<Authenticator>;

  export const Receiver = ReceiverP;
  export type Receiver<Authenticator extends AnyServerAuthenticator> =
    ReceiverP<Authenticator>;
  export const SocketBroker = SocketBrokerI;
  export type SocketBroker = SocketBrokerI;

  export const SocketServerId = SocketServerIdI;
  export type SocketServerId = string;

  export const WsServer = WsServerI;
  export type WsServer = WsServerI;

  export const AuthController = AuthControllerP;
  export type AuthController<Authenticator extends AnyServerAuthenticator> =
    AuthControllerP<Authenticator>;

  export const AuthenticatorList = AuthenticatorListI;
  export type AuthenticatorList = AuthenticatorListI;

  export const NextServer = NextServerI;
  export type NextServer = NextServerI;

  export const NextReceiver = NextReceiverP;
  export type NextReceiver = NextReceiverP;

  export const initModule = <
    Authenticator extends AnyServerAuthenticator,
    Value extends EventValue = EventValue
  >(
    configs: WebviewConfigs<Authenticator, Value>
  ): MachinatPlatform<
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

      SocketServerP,
      { provide: WsServerI, withProvider: wsServerFactory },
      { provide: SocketBrokerI, withProvider: LocalOnlyBroker },

      ReceiverP,
      {
        provide: Http.UpgradeRouteList,
        withProvider: webSocketRouteFactory,
      },

      { provide: BaseMarshaler.TypeList, withValue: WebviewConnection },
      { provide: BaseMarshaler.TypeList, withValue: WebviewUserChannel },
      { provide: BaseMarshaler.TypeList, withValue: WebviewTopicChannel },
      { provide: BaseMarshaler.TypeList, withValue: NoneUser },
      { provide: BaseMarshaler.TypeList, withValue: NoneChannel },

      AuthControllerP,
      { provide: Http.RequestRouteList, withProvider: authRouteFactory },
    ];

    if (!configs.noNextServer) {
      provisions.push(
        NextReceiverP,
        { provide: NextServerI, withProvider: nextServerFactory },
        {
          provide: Http.RequestRouteList,
          withProvider: nextRouteFactory,
        }
      );
    }

    provisions.push(
      ...configs.authPlatforms.map((provider) => ({
        provide: AuthenticatorList,
        withProvider: provider,
      }))
    );

    return {
      name: WEBVIEW,
      utilitiesInterface: PlatformUtilitiesI,
      eventMiddlewares: configs.eventMiddlewares,
      dispatchMiddlewares: configs.dispatchMiddlewares,
      provisions,

      startHook: makeContainer({ deps: [BotP, NextReceiverP] })(
        async (bot, nextReceiver) => {
          await Promise.all([bot.start(), nextReceiver.prepare()]);
        }
      ),
      stopHook: makeContainer({ deps: [BotP] })(async (bot) => bot.stop()),
    };
  };
}

export default Webview;
