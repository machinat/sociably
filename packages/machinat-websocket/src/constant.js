// @flow
import { abstractInterface, namedInterface } from '@machinat/core/service';
import type { IncomingMessage } from 'http';
import type { Socket as NetSocket } from 'net';
import type { ConnectionChannel } from './channel';
import type {
  WebSocketJob,
  VerifySignInFn,
  VerifyUpgradeFn,
  WebSocketPlatformMounter,
  WebSocketPlatformConfigs,
  WS,
} from './types';

export const WEBSOCKET = 'websocket';

class AbstractWSServer {
  +handleUpgrade: (
    req: IncomingMessage,
    socket: NetSocket,
    head: Buffer,
    cb: (WS) => void
  ) => void;
}

export const WSServerI = abstractInterface<AbstractWSServer>()(
  AbstractWSServer
);

class ClusterBroker {
  +start: () => Promise<void>;

  +stop: () => Promise<void>;

  +dispatchRemote: (job: WebSocketJob) => Promise<null | ConnectionChannel[]>;

  +attachTopicRemote: (
    connection: ConnectionChannel,
    topic: string
  ) => Promise<boolean>;

  +detachTopicRemote: (
    connection: ConnectionChannel,
    topic: string
  ) => Promise<boolean>;

  +disconnectRemote: (connection: ConnectionChannel) => Promise<boolean>;
  +onRemoteEvent: (handler: (job: WebSocketJob) => void) => void;
}

export const ClusterBrokerI = abstractInterface<ClusterBroker>()(ClusterBroker);

export const UPGRADE_VERIFIER_I = namedInterface<VerifyUpgradeFn>({
  name: 'WebSocketUpgradeVerifier',
});

export const SIGN_IN_VERIFIER_I = namedInterface<VerifySignInFn<any, any>>({
  name: 'WebSocketSignInVerifier',
});

export const SERVER_ID_I = namedInterface<string>({
  name: 'WebSocketServerId',
});

export const WEBSOCKET_PLATFORM_MOUNTER_I = namedInterface<
  WebSocketPlatformMounter<any>
>({ name: 'WebSocketPlatformMounter' });

export const WEBSOCKET_PLATFORM_CONFIGS_I = namedInterface<
  WebSocketPlatformConfigs<any>
>({ name: 'WebSocketPlatformConfigs' });
