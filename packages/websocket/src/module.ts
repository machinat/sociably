import WS from 'ws';
import uniqid from 'uniqid';
import { container, factory } from '@machinat/core/service';
import { BaseBot } from '@machinat/core/base';
import type { PlatformModule } from '@machinat/core/types';
import HTTP from '@machinat/http';
import type { HTTPUpgradeRouting } from '@machinat/http/types';

import { WEBSOCKET } from './constant';
import {
  BrokerI,
  WS_SERVER_I,
  UPGRADE_VERIFIER_I,
  LOGIN_VERIFIER_I,
  SERVER_ID_I,
  PLATFORM_MOUNTER_I,
  PLATFORM_CONFIGS_I,
} from './interface';
import { BotP } from './bot';
import { TransmitterP } from './transmitter';
import { ReceiverP } from './receiver';
import LocalOnlyBroker from './broker/localOnlyBroker';
import type {
  EventValue,
  VerifyLoginFn,
  WebSocketEventContext,
  WebSocketJob,
  WebSocketDispatchFrame,
  WebSocketResult,
  WebSocketPlatformConfigs,
} from './types';

/** @internal */
const createWSServer = factory<WS.Server>({ lifetime: 'singleton' })(
  () => new WS.Server({ noServer: true })
);

/** @internal */
const createUniqServerId = factory<() => string>({
  lifetime: 'transient',
})(() => uniqid());

/** @internal */
const upgradeRoutingFactory = factory<HTTPUpgradeRouting>({
  lifetime: 'transient',
  deps: [PLATFORM_CONFIGS_I, ReceiverP],
})(
  (
    configs: WebSocketPlatformConfigs<any, any>,
    receiver: ReceiverP<any, any>
  ) => ({
    name: WEBSOCKET,
    path: configs.entryPath || '/',
    handler: receiver.handleUpgradeCallback(),
  })
);

const WebSocket = {
  Bot: BotP,
  Receiver: ReceiverP,
  Transmitter: TransmitterP,
  ClusterBrokerI: BrokerI,
  SERVER_I: WS_SERVER_I,
  UPGRADE_VERIFIER_I,
  LOGIN_VERIFIER_I,
  SERVER_ID_I,
  CONFIGS_I: PLATFORM_CONFIGS_I,

  initModule: <
    Value extends EventValue<any, any, any>,
    LoginVerifier extends VerifyLoginFn<any, any, any>
  >(
    configs: WebSocketPlatformConfigs<Value, LoginVerifier> = {} as any
  ): PlatformModule<
    LoginVerifier extends VerifyLoginFn<infer User, infer AuthInfo, any>
      ? WebSocketEventContext<Value, User, AuthInfo>
      : never,
    null,
    WebSocketJob,
    WebSocketDispatchFrame,
    WebSocketResult
  > => {
    return {
      name: WEBSOCKET,
      mounterInterface: PLATFORM_MOUNTER_I,
      eventMiddlewares: configs.eventMiddlewares as any,
      dispatchMiddlewares: configs.dispatchMiddlewares,
      provisions: [
        { provide: PLATFORM_CONFIGS_I, withValue: configs },
        { provide: WS_SERVER_I, withProvider: createWSServer },

        BotP,
        {
          provide: BaseBot.PLATFORMS_I,
          withProvider: BotP,
          platform: WEBSOCKET,
        },

        TransmitterP,
        { provide: SERVER_ID_I, withProvider: createUniqServerId },
        { provide: BrokerI, withProvider: LocalOnlyBroker },

        ReceiverP,
        {
          provide: HTTP.UPGRADE_ROUTINGS_I,
          withProvider: upgradeRoutingFactory,
        },
      ],

      startHook: container<Promise<void>>({
        deps: [BotP],
      })(async (bot: BotP) => {
        await bot.start();
      }),
    };
  },
};

declare namespace WebSocket {
  export type Bot = BotP;
  export type Receiver<
    Value extends EventValue<any, any, any> = EventValue<
      string,
      string,
      unknown
    >,
    LoginVerifier extends VerifyLoginFn<any, any, any> = VerifyLoginFn<
      null,
      null,
      unknown
    >
  > = ReceiverP<Value, LoginVerifier>;
  export type Transmitter = TransmitterP;
  export type ClusterBrokerI = BrokerI;
}

export default WebSocket;
