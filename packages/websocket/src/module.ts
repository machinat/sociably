import { makeContainer, makeFactoryProvider } from '@machinat/core/service';
import { BaseBot, BaseMarshaler } from '@machinat/core/base';
import type { PlatformModule, MachinatUser } from '@machinat/core/types';
import Http from '@machinat/http';
import type { HttpUpgradeRouting } from '@machinat/http/types';

import { WEBSOCKET } from './constant';
import {
  BrokerI as WebSocketBrokerI,
  WS_SERVER_I,
  UPGRADE_VERIFIER_I,
  LOGIN_VERIFIER_I,
  SERVER_ID_I,
  PLATFORM_MOUNTER_I,
  PLATFORM_CONFIGS_I,
} from './interface';
import { BotP } from './bot';
import { ServerP } from './server';
import { ReceiverP } from './receiver';
import LocalOnlyBroker from './brokers/LocalOnlyBroker';
import {
  WebSocketConnection,
  WebSocketUserChannel,
  WebSocketTopicChannel,
} from './channel';
import createWsServer from './utils/createWsServer';
import type {
  WebSocketEventContext,
  WebSocketJob,
  WebSocketDispatchFrame,
  WebSocketResult,
  WebSocketPlatformConfigs,
} from './types';

/** @internal */
const wsServerFactory = makeFactoryProvider({ lifetime: 'singleton' })(
  createWsServer
);

/** @internal */
const upgradeRoutingFactory = makeFactoryProvider({
  lifetime: 'transient',
  deps: [PLATFORM_CONFIGS_I, ReceiverP] as const,
})(
  (configs, receiver): HttpUpgradeRouting => ({
    name: WEBSOCKET,
    path: configs.entryPath || '/',
    handler: receiver.handleUpgradeCallback(),
  })
);

const WebSocket = {
  Bot: BotP,
  Receiver: ReceiverP,
  Server: ServerP,
  BrokerI: WebSocketBrokerI,
  WS_SERVER_I,
  UPGRADE_VERIFIER_I,
  LOGIN_VERIFIER_I,
  SERVER_ID_I,
  CONFIGS_I: PLATFORM_CONFIGS_I,

  initModule: <User extends null | MachinatUser, Auth>(
    configs: WebSocketPlatformConfigs<User, Auth>
  ): PlatformModule<
    WebSocketEventContext<User, Auth>,
    null,
    WebSocketJob,
    WebSocketDispatchFrame,
    WebSocketResult
  > => {
    return {
      name: WEBSOCKET,
      mounterInterface: PLATFORM_MOUNTER_I,
      eventMiddlewares: configs.eventMiddlewares,
      dispatchMiddlewares: configs.dispatchMiddlewares,
      provisions: [
        { provide: PLATFORM_CONFIGS_I, withValue: configs },
        { provide: WS_SERVER_I, withProvider: wsServerFactory },

        BotP,
        {
          provide: BaseBot.PLATFORMS_I,
          withProvider: BotP,
          platform: WEBSOCKET,
        },

        ServerP,
        { provide: WebSocketBrokerI, withProvider: LocalOnlyBroker },

        ReceiverP,
        {
          provide: Http.UPGRADE_ROUTINGS_I,
          withProvider: upgradeRoutingFactory,
        },

        { provide: BaseMarshaler.TYPINGS_I, withValue: WebSocketConnection },
        { provide: BaseMarshaler.TYPINGS_I, withValue: WebSocketUserChannel },
        { provide: BaseMarshaler.TYPINGS_I, withValue: WebSocketTopicChannel },
      ],

      startHook: makeContainer({
        deps: [BotP] as const,
      })(async (bot) => {
        await bot.start();
      }),
    };
  },
};

declare namespace WebSocket {
  export type Bot = BotP;
  export type Receiver<User extends null | MachinatUser, Auth> = ReceiverP<
    User,
    Auth
  >;
  export type Server<User extends null | MachinatUser, Auth> = ServerP<
    User,
    Auth
  >;
  export type BrokerI = WebSocketBrokerI;
}

export default WebSocket;
