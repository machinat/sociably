import type { Server as WebScoketServer } from 'ws';
import { abstractInterface, makeInterface } from '@machinat/core/service';
import { ConnectionChannel } from './channel';
import type {
  WebSocketJob,
  VerifyLoginFn,
  VerifyUpgradeFn,
  WebSocketPlatformMounter,
  WebSocketPlatformConfigs,
} from './types';

export const WS_SERVER_I = makeInterface<WebScoketServer>({
  name: 'WebSocketServerI',
});

export const UPGRADE_VERIFIER_I = makeInterface<VerifyUpgradeFn>({
  name: 'WebSocketUpgradeVerifierI',
});

export const AUTHENTICATOR_I = makeInterface<VerifyLoginFn<any, any>>({
  name: 'WebSocketAuthenticatorI',
});

export const SERVER_ID_I = makeInterface<string>({
  name: 'WebSocketServerIdI',
});

export const PLATFORM_MOUNTER_I = makeInterface<WebSocketPlatformMounter<any>>({
  name: 'WebSocketPlatformMounterI',
});

export const PLATFORM_CONFIGS_I = makeInterface<
  WebSocketPlatformConfigs<any, any>
>({ name: 'WebSocketPlatformConfigsI' });

export abstract class ClusterBroker {
  abstract start(): Promise<void>;
  abstract stop(): Promise<void>;
  abstract dispatchRemote(
    _job: WebSocketJob
  ): Promise<null | ConnectionChannel[]>;

  abstract subscribeTopicRemote(
    _connection: ConnectionChannel,
    _topic: string
  ): Promise<boolean>;

  abstract unsubscribeTopicRemote(
    _connection: ConnectionChannel,
    _topic: string
  ): Promise<boolean>;

  abstract disconnectRemote(_connection: ConnectionChannel): Promise<boolean>;
  abstract onRemoteEvent(_handler: (job: WebSocketJob) => void): void;
}

export const ClusterBrokerI = abstractInterface<ClusterBroker>({
  name: 'WebSocketClusterBrokerI',
})(ClusterBroker);
