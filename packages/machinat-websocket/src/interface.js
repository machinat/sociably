// @flow
/* eslint-disable class-methods-use-this */
import { abstractInterface, makeInterface } from '@machinat/core/service';
import type { IncomingMessage } from 'http';
import type { Socket as NetSocket } from 'net';
import type { ConnectionChannel } from './channel';
import type {
  WebSocketJob,
  VerifyLoginFn,
  VerifyUpgradeFn,
  WebSocketPlatformMounter,
  WebSocketPlatformConfigs,
  WS,
} from './types';

export const WEBSOCKET = 'websocket';

class AbstractWSServer {
  handleUpgrade(
    _req: IncomingMessage,
    _socket: NetSocket,
    _head: Buffer,
    _cb: (WS) => void
  ): void {
    throw new TypeError('method called on abstract class');
  }
}

export const WSServerI = abstractInterface<AbstractWSServer>()(
  AbstractWSServer
);

class ClusterBroker {
  start(): Promise<void> {
    throw new TypeError('method called on abstract class');
  }

  stop(): Promise<void> {
    throw new TypeError('method called on abstract class');
  }

  dispatchRemote(_job: WebSocketJob): Promise<null | ConnectionChannel[]> {
    throw new TypeError('method called on abstract class');
  }

  attachTopicRemote(
    _connection: ConnectionChannel,
    _topic: string
  ): Promise<boolean> {
    throw new TypeError('method called on abstract class');
  }

  detachTopicRemote(
    _connection: ConnectionChannel,
    _topic: string
  ): Promise<boolean> {
    throw new TypeError('method called on abstract class');
  }

  disconnectRemote(_connection: ConnectionChannel): Promise<boolean> {
    throw new TypeError('method called on abstract class');
  }

  onRemoteEvent(_handler: (job: WebSocketJob) => void): void {
    throw new TypeError('method called on abstract class');
  }
}

export const ClusterBrokerI = abstractInterface<ClusterBroker>()(ClusterBroker);

export const UPGRADE_VERIFIER_I = makeInterface<VerifyUpgradeFn>({
  name: 'WebSocketUpgradeVerifier',
});

export const LOGIN_VERIFIER_I = makeInterface<VerifyLoginFn<any, any>>({
  name: 'WebSocketLoginVerifier',
});

export const SERVER_ID_I = makeInterface<string>({
  name: 'WebSocketServerId',
});

export const WEBSOCKET_PLATFORM_MOUNTER_I = makeInterface<
  WebSocketPlatformMounter<any>
>({ name: 'WebSocketPlatformMounter' });

export const WEBSOCKET_PLATFORM_CONFIGS_I = makeInterface<
  WebSocketPlatformConfigs<any>
>({ name: 'WebSocketPlatformConfigs' });
