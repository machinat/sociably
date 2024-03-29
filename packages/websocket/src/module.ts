import type { SociablyPlatform, SociablyUser } from '@sociably/core';
import {
  serviceContainer,
  serviceProviderFactory,
} from '@sociably/core/service';
import BaseBot from '@sociably/core/base/Bot';
import BaseMarshaler from '@sociably/core/base/Marshaler';
import Http from '@sociably/http';
import type { UpgradeRoute } from '@sociably/http';

import { WEBSOCKET } from './constant.js';
import {
  ServerIdI,
  PlatformUtilitiesI,
  BrokerI,
  WsServerI,
  UpgradeVerifierI,
  LoginVerifierI,
  ConfigsI,
} from './interface.js';
import { BotP } from './Bot.js';
import { ServerP } from './Server.js';
import { ReceiverP } from './Receiver.js';
import LocalOnlyBrokerP from './broker/LocalOnlyBroker.js';
import WebSocketConnection from './Connection.js';
import createWsServer from './utils/createWsServer.js';
import type {
  WebSocketEventContext,
  WebSocketJob,
  WebSocketDispatchFrame,
  WebSocketResult,
  WebSocketConfigs,
} from './types.js';

const wsServerFactory = serviceProviderFactory({ lifetime: 'singleton' })(
  createWsServer
);

const upgradeRouteFactory = serviceProviderFactory({
  lifetime: 'transient',
  deps: [ConfigsI, ServerP],
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
  export type Receiver<User extends null | SociablyUser, Auth> = ReceiverP<
    User,
    Auth
  >;

  export const Server = ServerP;
  export type Server<User extends null | SociablyUser, Auth> = ServerP<
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

  export const initModule = <User extends null | SociablyUser, Auth>(
    configs: WebSocketConfigs<User, Auth> = {}
  ): SociablyPlatform<
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
      ],

      startHook: serviceContainer({ deps: [BotP] })(async (bot) => {
        await bot.start();
      }),
      stopHook: serviceContainer({ deps: [BotP] })(async (bot) => {
        await bot.stop();
      }),
    };
  };
}

export default WebSocket;
