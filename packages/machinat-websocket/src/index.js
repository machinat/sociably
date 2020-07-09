// @flow
import WS from 'ws';
import uniqid from 'uniqid';
import { container, factory } from '@machinat/core/service';
import Base from '@machinat/core/base';
import type { PlatformModule } from '@machinat/core/types';
import HTTP from '@machinat/http';
import type { HTTPUpgradeRouting } from '@machinat/http/types';
import {
  WSServerI,
  ClusterBrokerI,
  UPGRADE_VERIFIER_I,
  AUTHENTICATOR_I,
  SERVER_ID_I,
  WEBSOCKET_PLATFORM_MOUNTER_I,
  WEBSOCKET_PLATFORM_CONFIGS_I,
} from './interface';
import WebSocketBot from './bot';
import Transmitter from './transmitter';
import WebSocketReceiver from './receiver';
import LocalOnlyBroker from './broker/localOnlyBroker';
import { WEBSOCKET } from './constant';
import type {
  WebSocketEventContext,
  WebSocketJob,
  WebSocketDispatchFrame,
  WebSocketResult,
  WebSocketPlatformConfigs,
} from './types';

export { Event } from './component';

const createWSServer = factory<() => WS>({ lifetime: 'singleton' })(
  () => new WS.Server({ noServer: true })
);

const createUniqServerId = factory<() => string>({
  lifetime: 'transient',
})(() => uniqid());

const upgradeRoutingFactory = factory<HTTPUpgradeRouting>({
  lifetime: 'transient',
  deps: [WEBSOCKET_PLATFORM_CONFIGS_I, WebSocketReceiver],
})(
  (
    configs: WebSocketPlatformConfigs<any, any>,
    receiver: WebSocketReceiver
  ) => ({
    name: 'websocket',
    path: configs.entryPath || '/',
    handler: receiver.handleUpgradeCallback(),
  })
);

const WebSocket = {
  Bot: WebSocketBot,
  Receiver: WebSocketReceiver,
  Transmitter,
  WSServerI,
  ClusterBrokerI,
  UPGRADE_VERIFIER_I,
  AUTHENTICATOR_I,
  SERVER_ID_I,
  CONFIGS_I: WEBSOCKET_PLATFORM_CONFIGS_I,

  initModule: <AuthInfo, Credential>(
    configs: WebSocketPlatformConfigs<AuthInfo, Credential> = {}
  ): PlatformModule<
    WebSocketEventContext<AuthInfo>,
    null,
    WebSocketJob,
    WebSocketDispatchFrame,
    WebSocketResult
  > => {
    return {
      name: WEBSOCKET,
      mounterInterface: WEBSOCKET_PLATFORM_MOUNTER_I,
      eventMiddlewares: configs.eventMiddlewares,
      dispatchMiddlewares: configs.dispatchMiddlewares,
      provisions: [
        WebSocketBot,
        {
          provide: Base.BotI,
          withProvider: WebSocketBot,
          platforms: [WEBSOCKET],
        },

        Transmitter,
        { provide: SERVER_ID_I, withProvider: createUniqServerId },
        { provide: WSServerI, withProvider: createWSServer },
        { provide: ClusterBrokerI, withProvider: LocalOnlyBroker },

        WebSocketReceiver,
        { provide: WEBSOCKET_PLATFORM_CONFIGS_I, withValue: configs },
        {
          provide: HTTP.UPGRADE_ROUTINGS_I,
          withProvider: upgradeRoutingFactory,
        },
      ],
      startHook: container({
        deps: [WebSocketBot],
      })(async (bot: WebSocketBot) => {
        await bot.start();
      }),
    };
  },
};

export default WebSocket;
