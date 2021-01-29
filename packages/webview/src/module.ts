import createNextServer from 'next';
import { BaseBot, BaseMarshaler } from '@machinat/core/base';
import type { PlatformModule } from '@machinat/core/types';
import { makeContainer, makeFactoryProvider } from '@machinat/core/service';
import { ServiceProvision } from '@machinat/core/service/types';
import { AnyServerAuthorizer } from '@machinat/auth/types';
import Http from '@machinat/http';
import type {
  RequestRoute,
  DefaultRequestRoute,
  UpgradeRoute,
} from '@machinat/http/types';
import LocalOnlyBroker from '@machinat/websocket/brokers/LocalOnlyBroker';
import createWsServer from '@machinat/websocket/utils/createWsServer';
import type { WebSocketJob, WebSocketResult } from '@machinat/websocket/types';

import { WEBVIEW, DEFAULT_AUTH_PATH, DEFAULT_WEBSOCKET_PATH } from './constant';
import {
  AuthControllerP,
  AUTHORIZERS_I,
  NextReceiverP,
  NEXT_SERVER_I,
  SocketBrokerI as BrokerI,
  SocketServerP as ServerP,
  WS_SERVER_I,
  SOCKET_SERVER_ID_I,
  PLATFORM_MOUNTER_I,
  PLATFORM_CONFIGS_I,
} from './interface';
import { BotP } from './bot';
import { ReceiverP } from './receiver';
import {
  WebviewConnection,
  WebviewUserChannel,
  WebviewTopicChannel,
} from './channel';
import { NoneUser, NoneChannel } from './noneAuthorizer';
import type {
  WebviewEventContext,
  WebviewDispatchFrame,
  WebviewPlatformConfigs,
} from './types';

/** @internal */

const nextServerFactory = makeFactoryProvider({
  lifetime: 'singleton',
  deps: [PLATFORM_CONFIGS_I],
})(({ nextServerOptions }) => createNextServer(nextServerOptions || {}));

/** @internal */
const wsServerFactory = makeFactoryProvider({ lifetime: 'singleton' })(
  createWsServer
);

/** @internal */
const webSocketRoutingFactory = makeFactoryProvider({
  lifetime: 'transient',
  deps: [ServerP, PLATFORM_CONFIGS_I] as const,
})(
  (server, { webSocketPath }): UpgradeRoute => ({
    name: 'websocket',
    path: webSocketPath || DEFAULT_WEBSOCKET_PATH,
    handler: (req, ns, head) => server.handleUpgrade(req, ns, head),
  })
);

/** @internal */
const authRoutingFactory = makeFactoryProvider({
  lifetime: 'transient',
  deps: [AuthControllerP, PLATFORM_CONFIGS_I] as const,
})(
  (controller, { authApiPath }): RequestRoute => ({
    name: 'auth',
    path: authApiPath || DEFAULT_AUTH_PATH,
    handler: (req, res, routingInfo) => {
      controller.delegateAuthRequest(req, res, routingInfo);
    },
  })
);

/** @internal */
const nextRoutingFactory = makeFactoryProvider({
  lifetime: 'transient',
  deps: [NextReceiverP, PLATFORM_CONFIGS_I] as const,
})((receiver, { webviewPath }): RequestRoute | DefaultRequestRoute => {
  const handler = receiver.handleRequestCallback();
  return webviewPath
    ? { name: 'next', handler, path: webviewPath }
    : { name: 'next', handler, default: true };
});

const Webview = {
  CONFIGS_I: PLATFORM_CONFIGS_I,

  Bot: BotP,
  Receiver: ReceiverP,
  SocketServer: ServerP,
  SocketBrokerI: BrokerI,
  WS_SERVER_I,
  SOCKET_SERVER_ID_I,

  AuthController: AuthControllerP,
  AUTHORIZERS_I,

  NextReceiver: NextReceiverP,
  NEXT_SERVER_I,

  initModule: <Authorizer extends AnyServerAuthorizer>(
    configs: WebviewPlatformConfigs<Authorizer>
  ): PlatformModule<
    WebviewEventContext<Authorizer>,
    null,
    WebSocketJob,
    WebviewDispatchFrame<Authorizer>,
    WebSocketResult
  > => {
    const provisions: ServiceProvision<unknown>[] = [
      { provide: PLATFORM_CONFIGS_I, withValue: configs },

      BotP,
      {
        provide: BaseBot.PLATFORMS_I,
        withProvider: BotP,
        platform: WEBVIEW,
      },

      ServerP,
      { provide: WS_SERVER_I, withProvider: wsServerFactory },
      { provide: BrokerI, withProvider: LocalOnlyBroker },

      ReceiverP,
      {
        provide: Http.UPGRADE_ROUTES_I,
        withProvider: webSocketRoutingFactory,
      },

      { provide: BaseMarshaler.TYPINGS_I, withValue: WebviewConnection },
      { provide: BaseMarshaler.TYPINGS_I, withValue: WebviewUserChannel },
      { provide: BaseMarshaler.TYPINGS_I, withValue: WebviewTopicChannel },
      { provide: BaseMarshaler.TYPINGS_I, withValue: NoneUser },
      { provide: BaseMarshaler.TYPINGS_I, withValue: NoneChannel },

      AuthControllerP,
      { provide: Http.UPGRADE_ROUTES_I, withProvider: authRoutingFactory },
    ];

    if (!configs.noNextServer) {
      provisions.push(
        NextReceiverP,
        { provide: NEXT_SERVER_I, withProvider: nextServerFactory },
        {
          provide: Http.UPGRADE_ROUTES_I,
          withProvider: nextRoutingFactory,
        }
      );
    }

    return {
      name: WEBVIEW,
      mounterInterface: PLATFORM_MOUNTER_I,
      eventMiddlewares: configs.eventMiddlewares,
      dispatchMiddlewares: configs.dispatchMiddlewares,
      provisions,

      startHook: makeContainer({
        deps: [BotP, NextReceiverP] as const,
      })(async (bot, nextReceiver) => {
        await Promise.all([bot.start(), nextReceiver.prepare()]);
      }),
    };
  },
};

declare namespace Webview {
  export type Bot<Authorizer extends AnyServerAuthorizer> = BotP<Authorizer>;

  export type Receiver<Authorizer extends AnyServerAuthorizer> = ReceiverP<
    Authorizer
  >;

  export type SocketServer<Authorizer extends AnyServerAuthorizer> = ServerP<
    Authorizer
  >;

  export type SocketBrokerI = BrokerI;
}

export default Webview;
