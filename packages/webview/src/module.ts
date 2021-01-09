import { makeContainer, makeFactoryProvider } from '@machinat/core/service';
import { ServiceProvision } from '@machinat/core/service/types';
import { BaseBot, BaseMarshaler } from '@machinat/core/base';
import type {
  PlatformModule,
  MachinatUser,
  MachinatChannel,
} from '@machinat/core/types';
import HTTP from '@machinat/http';
import type {
  HTTPRequestRouting,
  HTTPUpgradeRouting,
} from '@machinat/http/types';
import createNextServer from '@machinat/next/utils/createNextServer';
import LocalOnlyBroker from '@machinat/websocket/brokers/LocalOnlyBroker';
import createWsServer from '@machinat/websocket/utils/createWsServer';
import type { WebSocketJob, WebSocketResult } from '@machinat/websocket/types';

import { WEBVIEW } from './constant';
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
import type {
  WebviewEventContext,
  WebviewDispatchFrame,
  WebviewPlatformConfigs,
  AnyServerAuthorizer,
} from './types';

/** @internal */
const nextServerFactory = makeFactoryProvider({ lifetime: 'singleton' })(
  createNextServer
);

/** @internal */
const wsServerFactory = makeFactoryProvider({ lifetime: 'singleton' })(
  createWsServer
);

/** @internal */
const webSocketRoutingFactory = makeFactoryProvider({
  lifetime: 'transient',
  deps: [PLATFORM_CONFIGS_I, ReceiverP] as const,
})(
  (configs, receiver): HTTPUpgradeRouting => ({
    name: WEBVIEW,
    path: configs.webSocketPath || '/websocket',
    handler: receiver.handleUpgradeCallback(),
  })
);

/** @internal */
const authRoutingFactory = makeFactoryProvider({
  lifetime: 'transient',
  deps: [AuthControllerP, PLATFORM_CONFIGS_I] as const,
})(
  (controller, configs): HTTPRequestRouting => ({
    name: 'auth',
    path: configs.authPath || '/auth',
    handler: (req, res, routingInfo) => {
      controller.delegateAuthRequest(req, res, routingInfo);
    },
  })
);

/** @internal */
const nextRoutingFactory = makeFactoryProvider({
  lifetime: 'transient',
  deps: [NextReceiverP, PLATFORM_CONFIGS_I] as const,
})(
  (receiver, configs): HTTPRequestRouting => ({
    name: 'next',
    path: configs.nextPath || '/webview',
    handler: receiver.handleRequestCallback(),
  })
);

const Webview = {
  Bot: BotP,
  Receiver: ReceiverP,
  SocketServer: ServerP,
  SocketBrokerI: BrokerI,
  WS_SERVER_I,
  SOCKET_SERVER_ID_I,
  CONFIGS_I: PLATFORM_CONFIGS_I,

  AuthController: AuthControllerP,
  AUTHORIZERS_I,

  NextReceiverP,
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
        provide: HTTP.UPGRADE_ROUTINGS_I,
        withProvider: webSocketRoutingFactory,
      },

      { provide: BaseMarshaler.TYPINGS_I, withValue: WebviewConnection },
      { provide: BaseMarshaler.TYPINGS_I, withValue: WebviewUserChannel },
      { provide: BaseMarshaler.TYPINGS_I, withValue: WebviewTopicChannel },

      AuthControllerP,
      {
        provide: HTTP.UPGRADE_ROUTINGS_I,
        withProvider: authRoutingFactory,
      },
    ];

    if (!configs.noHostNext) {
      provisions.push(
        NextReceiverP,
        { provide: NEXT_SERVER_I, withProvider: nextServerFactory },
        {
          provide: HTTP.UPGRADE_ROUTINGS_I,
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

  export type Receiver<
    User extends MachinatUser,
    Channel extends MachinatChannel,
    AuthData
  > = ReceiverP<User, Channel, AuthData>;

  export type SocketServer<
    User extends MachinatUser,
    Channel extends MachinatChannel,
    AuthData
  > = ServerP<User, Channel, AuthData>;

  export type SocketBrokerI = BrokerI;
}

export default Webview;
