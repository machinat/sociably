// @flow
import WS from 'ws';
import uniqid from 'uniqid';
import { inject, factory } from '@machinat/core/service';
import type { PlatformModule } from '@machinat/core/types';
import HTTP from '@machinat/http';
import type { HTTPUpgradeRouting } from '@machinat/http/types';
import WebSocketBot from './bot';
import Transmitter from './transmitter';
import WebSocketReceiver from './receiver';
import LocalOnlyBroker from './broker/localOnlyBroker';
import {
  WEBSOCKET,
  WSServerI,
  ClusterBrokerI,
  UPGRADE_VERIFIER_I,
  AUTH_VERIFIER_I,
  SERVER_ID_I,
  WEBSOCKET_PLATFORM_MOUNTER_I,
  WEBSOCKET_PLATFORM_CONFIGS_I,
} from './constant';
import type {
  WebSocketEventContext,
  WebSocketJob,
  WebSocketDispatchFrame,
  WebSocketResult,
  WebSocketPlatformConfigs,
} from './types';

export { Event } from './component';

const createWSServer = factory<() => WS>({ lifetime: 'singleton' })(
  () => new WS({ noServer: true })
);

const createUniqServerId = factory<() => string>({ lifetime: 'transient' })(
  () => uniqid()
);

const upgradeRoutingFactory = factory<HTTPUpgradeRouting>({
  lifetime: 'transient',
  deps: [WEBSOCKET_PLATFORM_CONFIGS_I, WebSocketReceiver],
})((configs: WebSocketPlatformConfigs<any>, receiver: WebSocketReceiver) => ({
  name: 'websocket',
  path: configs.entryPath || '/',
  handler: receiver.handleUpgradeCallback(),
}));

const WebSocket = {
  Bot: WebSocketBot,
  Receiver: WebSocketReceiver,
  Transmitter,
  WSServerI,
  ClusterBrokerI,
  UPGRADE_VERIFIER_I,
  AUTH_VERIFIER_I,
  SERVER_ID_I,
  CONFIGS_I: WEBSOCKET_PLATFORM_CONFIGS_I,

  initModule: (
    configs: WebSocketPlatformConfigs<any> = {}
  ): PlatformModule<
    WebSocketEventContext<any>,
    null,
    WebSocketJob,
    WebSocketDispatchFrame,
    WebSocketResult
  > => ({
    name: WEBSOCKET,
    mounterInterface: WEBSOCKET_PLATFORM_MOUNTER_I,
    provisions: [
      WebSocketBot,
      WebSocketReceiver,
      Transmitter,
      { provide: WSServerI, withProvider: createWSServer },
      { provide: ClusterBrokerI, withProvider: LocalOnlyBroker },
      { provide: SERVER_ID_I, withProvider: createUniqServerId },
      { provide: WEBSOCKET_PLATFORM_CONFIGS_I, withValue: configs },
      { provide: HTTP.UPGRADE_ROUTINGS_I, withProvider: upgradeRoutingFactory },
    ],
    eventMiddlewares: configs.eventMiddlewares,
    dispatchMiddlewares: configs.dispatchMiddlewares,
    startHook: inject({
      deps: [WebSocketBot],
    })(async (bot: WebSocketBot) => {
      await bot.start();
    }),
  }),
};

export default WebSocket;
