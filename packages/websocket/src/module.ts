import { makeContainer, makeFactoryProvider } from '@machinat/core/service';
import { BaseBot, BaseMarshaler } from '@machinat/core/base';
import type { PlatformModule, MachinatUser } from '@machinat/core/types';
import Http from '@machinat/http';
import type { UpgradeRoute } from '@machinat/http/types';

import { WEBSOCKET } from './constant';
import {
  ServerIdI,
  PlatformMounterI,
  BrokerI as WebSocketBrokerI,
  WsServerI as WebSocketWsServerI,
  UpgradeVerifierI as WebSocketUpgradeVerifierI,
  LoginVerifierI as WebSocketLoginVerifierI,
  ConfigsI as WebSocketConfigsI,
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
  WebSocketConfigs,
} from './types';

/** @internal */
const wsServerFactory = makeFactoryProvider({ lifetime: 'singleton' })(
  createWsServer
);

/** @internal */
const upgradeRouteFactory = makeFactoryProvider({
  lifetime: 'transient',
  deps: [WebSocketConfigsI, ServerP] as const,
})(
  (configs, server): UpgradeRoute => ({
    name: WEBSOCKET,
    path: configs.entryPath || '/',
    handler: (req, ns, head) => server.handleUpgrade(req, ns, head),
  })
);

const WebSocket = {
  Bot: BotP,
  Receiver: ReceiverP,
  Server: ServerP,
  BrokerI: WebSocketBrokerI,
  WsServerI: WebSocketWsServerI,
  UpgradeVerifierI: WebSocketUpgradeVerifierI,
  LoginVerifierI: WebSocketLoginVerifierI,
  ConfigsI: WebSocketConfigsI,
  ServerIdI,

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
        { provide: WebSocketConfigsI, withValue: configs },
        { provide: WebSocketWsServerI, withProvider: wsServerFactory },

        BotP,
        {
          provide: BaseBot.PlatformMap,
          withProvider: BotP,
          platform: WEBSOCKET,
        },

        ServerP,
        { provide: WebSocketBrokerI, withProvider: LocalOnlyBroker },

        ReceiverP,
        {
          provide: Http.UpgradeRouteList,
          withProvider: upgradeRouteFactory,
        },

        { provide: BaseMarshaler.TypeI, withValue: WebSocketConnection },
        { provide: BaseMarshaler.TypeI, withValue: WebSocketUserChannel },
        { provide: BaseMarshaler.TypeI, withValue: WebSocketTopicChannel },
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
  export type WsServerI = WebSocketWsServerI;
  export type UpgradeVerifierI = WebSocketUpgradeVerifierI;
  export type LoginVerifierI = WebSocketLoginVerifierI;
  export type ServerIdI = string;
  export type ConfigsI = WebSocketConfigsI;
}

export default WebSocket;
