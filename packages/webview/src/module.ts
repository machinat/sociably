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
  SocketServerP,
  AuthControllerP,
  NextReceiverP,
  PlatformMounterI,
  SocketServerIdI,
  ConfigsI as WebviewConfigsI,
  SocketBrokerI as WebviewSocketBrokerI,
  WsServerI as WebviewWsServerI,
  AuthorizerList as WebviewAuthorizerList,
  NextServerI as WebviewNextServerI,
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
  WebviewConfigs,
} from './types';

/** @internal */

const nextServerFactory = makeFactoryProvider({
  lifetime: 'singleton',
  deps: [WebviewConfigsI],
})(({ nextServerOptions }) => createNextServer(nextServerOptions || {}));

/** @internal */
const wsServerFactory = makeFactoryProvider({ lifetime: 'singleton' })(
  createWsServer
);

/** @internal */
const webSocketRouteFactory = makeFactoryProvider({
  lifetime: 'transient',
  deps: [SocketServerP, WebviewConfigsI] as const,
})(
  (server, { webSocketPath }): UpgradeRoute => ({
    name: 'websocket',
    path: webSocketPath || DEFAULT_WEBSOCKET_PATH,
    handler: (req, ns, head) => server.handleUpgrade(req, ns, head),
  })
);

/** @internal */
const authRouteFactory = makeFactoryProvider({
  lifetime: 'transient',
  deps: [AuthControllerP, WebviewConfigsI] as const,
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
const nextRouteFactory = makeFactoryProvider({
  lifetime: 'transient',
  deps: [NextReceiverP, WebviewConfigsI] as const,
})((receiver, { webviewPath }): RequestRoute | DefaultRequestRoute => {
  const handler = receiver.handleRequestCallback();
  return webviewPath
    ? { name: 'next', handler, path: webviewPath }
    : { name: 'next', handler, default: true };
});

const Webview = {
  ConfigsI: WebviewConfigsI,

  Bot: BotP,
  Receiver: ReceiverP,
  SocketServer: SocketServerP,
  SocketBrokerI: WebviewSocketBrokerI,
  WsServerI: WebviewWsServerI,
  SocketServerIdI,

  AuthController: AuthControllerP,
  AuthorizerList: WebviewAuthorizerList,

  NextReceiver: NextReceiverP,
  NextServerI: WebviewNextServerI,

  initModule: <Authorizer extends AnyServerAuthorizer>(
    configs: WebviewConfigs<Authorizer>
  ): PlatformModule<
    WebviewEventContext<Authorizer>,
    null,
    WebSocketJob,
    WebviewDispatchFrame<Authorizer>,
    WebSocketResult
  > => {
    const provisions: ServiceProvision<unknown>[] = [
      { provide: WebviewConfigsI, withValue: configs },

      BotP,
      {
        provide: BaseBot.PlatformMap,
        withProvider: BotP,
        platform: WEBVIEW,
      },

      SocketServerP,
      { provide: WebviewWsServerI, withProvider: wsServerFactory },
      { provide: WebviewSocketBrokerI, withProvider: LocalOnlyBroker },

      ReceiverP,
      {
        provide: Http.UpgradeRouteList,
        withProvider: webSocketRouteFactory,
      },

      { provide: BaseMarshaler.TypeI, withValue: WebviewConnection },
      { provide: BaseMarshaler.TypeI, withValue: WebviewUserChannel },
      { provide: BaseMarshaler.TypeI, withValue: WebviewTopicChannel },
      { provide: BaseMarshaler.TypeI, withValue: NoneUser },
      { provide: BaseMarshaler.TypeI, withValue: NoneChannel },

      AuthControllerP,
      { provide: Http.UpgradeRouteList, withProvider: authRouteFactory },
    ];

    if (!configs.noNextServer) {
      provisions.push(
        NextReceiverP,
        { provide: WebviewNextServerI, withProvider: nextServerFactory },
        {
          provide: Http.UpgradeRouteList,
          withProvider: nextRouteFactory,
        }
      );
    }

    return {
      name: WEBVIEW,
      mounterInterface: PlatformMounterI,
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

  export type SocketServer<
    Authorizer extends AnyServerAuthorizer
  > = SocketServerP<Authorizer>;

  export type ConfigsI = WebviewConfigsI;
  export type SocketBrokerI = WebviewSocketBrokerI;
  export type WsServerI = WebviewWsServerI;
  export type SocketServerIdI = string;

  export type AuthController<
    Authorizer extends AnyServerAuthorizer
  > = AuthControllerP<Authorizer>;
  export type AuthorizerList = WebviewAuthorizerList;

  export type NextServerI = WebviewNextServerI;
  export type NextReceiver = NextReceiverP;
}

export default Webview;
