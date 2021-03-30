import { makeContainer, makeFactoryProvider } from '@machinat/core/service';
import BaseBot from '@machinat/core/base/Bot';
import BaseMarshaler from '@machinat/core/base/Marshaler';
import type { MachinatPlatform, MachinatUser } from '@machinat/core/types';
import Http from '@machinat/http';
import type { UpgradeRoute } from '@machinat/http/types';

import { WEBSOCKET } from './constant';
import {
  ServerIdI,
  PlatformUtilitiesI,
  BrokerI,
  WsServerI,
  UpgradeVerifierI,
  LoginVerifierI,
  ConfigsI,
} from './interface';
import { BotP } from './bot';
import { ServerP } from './server';
import { ReceiverP } from './receiver';
import LocalOnlyBrokerP from './broker/LocalOnlyBroker';
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
namespace WebSocket {
  export const Bot = BotP;
  export type Bot = BotP;

  export const Receiver = ReceiverP;
  export type Receiver<User extends null | MachinatUser, Auth> = ReceiverP<
    User,
    Auth
  >;

  export const Server = ServerP;
  export type Server<User extends null | MachinatUser, Auth> = ServerP<
    User,
    Auth
  >;

  export const Broker = BrokerI;
  export type Broker = BrokerI;

  export const WsServer = WsServerI;
  export type WsServer = WsServerI;

  export const UpgradeVerifier = UpgradeVerifierI;
  export type UpgradeVerifier = UpgradeVerifierI;

  export const Configs = ConfigsI;
  export type Configs = ConfigsI;

  export const LoginVerifier = LoginVerifierI;
  export type LoginVerifier = LoginVerifierI;

  export const ServerId = ServerIdI;
  export type ServerId = string;

  export const initModule = <User extends null | MachinatUser, Auth>(
    configs: WebSocketConfigs<User, Auth> = {}
  ): MachinatPlatform<
    WebSocketEventContext<User, Auth>,
    null,
    WebSocketJob,
    WebSocketDispatchFrame,
    WebSocketResult
  > => {
    return {
      name: WEBSOCKET,
      utilitiesInterface: PlatformUtilitiesI,
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
  };
}

export default WebSocket;
