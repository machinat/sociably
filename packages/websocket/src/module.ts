import { makeContainer, makeFactoryProvider } from '@machinat/core/service';
import BaseBot from '@machinat/core/base/Bot';
import BaseMarshaler from '@machinat/core/base/Marshaler';
import type { PlatformModule, MachinatUser } from '@machinat/core/types';
import Http from '@machinat/http';
import type { UpgradeRoute } from '@machinat/http/types';

import { WEBSOCKET } from './constant';
import {
  ServerIdI,
  PlatformMounterI,
  BrokerI,
  WsServerI,
  UpgradeVerifierI,
  LoginVerifierI,
  ConfigsI,
} from './interface';
import { BotP } from './bot';
import { ServerP } from './server';
import { ReceiverP } from './receiver';
import LocalOnlyBrokerP from './brokers/LocalOnlyBroker';
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
  WebSocketConfigs,
} from './types';

/** @internal */
const wsServerFactory = makeFactoryProvider({ lifetime: 'singleton' })(
  createWsServer
);

/** @internal */
const upgradeRouteFactory = makeFactoryProvider({
  lifetime: 'transient',
  deps: [ConfigsI, ServerP] as const,
})(
  (configs, server): UpgradeRoute => ({
    name: WEBSOCKET,
    path: configs.entryPath || '/',
    handler: (req, ns, head) => server.handleUpgrade(req, ns, head),
  })
);

/**
 * @category Root
 */
const WebSocket = {
  Bot: BotP,
  Receiver: ReceiverP,
  Server: ServerP,
  Broker: BrokerI,
  WsServer: WsServerI,
  UpgradeVerifier: UpgradeVerifierI,
  LoginVerifier: LoginVerifierI,
  Configs: ConfigsI,
  ServerId: ServerIdI,

  initModule: <User extends null | MachinatUser, Auth>(
    configs: WebSocketConfigs<User, Auth> = {}
  ): PlatformModule<
    WebSocketEventContext<User, Auth>,
    null,
    WebSocketJob,
    WebSocketDispatchFrame,
    WebSocketResult
  > => {
    return {
      name: WEBSOCKET,
      mounterInterface: PlatformMounterI,
      eventMiddlewares: configs.eventMiddlewares,
      dispatchMiddlewares: configs.dispatchMiddlewares,
      provisions: [
        { provide: ConfigsI, withValue: configs },
        { provide: WsServerI, withProvider: wsServerFactory },

        BotP,
        {
          provide: BaseBot.PlatformMap,
          withProvider: BotP,
          platform: WEBSOCKET,
        },

        ServerP,
        { provide: BrokerI, withProvider: LocalOnlyBrokerP },

        ReceiverP,
        {
          provide: Http.UpgradeRouteList,
          withProvider: upgradeRouteFactory,
        },

        { provide: BaseMarshaler.TypeList, withValue: WebSocketConnection },
        { provide: BaseMarshaler.TypeList, withValue: WebSocketUserChannel },
        { provide: BaseMarshaler.TypeList, withValue: WebSocketTopicChannel },
      ],

      startHook: makeContainer({
        deps: [BotP] as const,
      })(async (bot) => {
        await bot.start();
      }),
    };
  },
};

/**
 * @category Root
 */
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
  export type Broker = BrokerI;
  export type WsServer = WsServerI;
  export type UpgradeVerifier = UpgradeVerifierI;
  export type LoginVerifier = LoginVerifierI;
  export type ServerId = string;
  export type Configs = ConfigsI;
}

export default WebSocket;
