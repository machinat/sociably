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

/**
 * @category Interface
 */
export const WS_SERVER_I = makeInterface<WebScoketServer>({
  name: 'WebSocketServerI',
});

/**
 * @category Interface
 */
export const UPGRADE_VERIFIER_I = makeInterface<VerifyUpgradeFn>({
  name: 'WebSocketUpgradeVerifierI',
});

/**
 * @category Interface
 */
export const LOGIN_VERIFIER_I = makeInterface<VerifyLoginFn<any, any, any>>({
  name: 'WebSocketLoginVerifierI',
});

/**
 * @category Interface
 */
export const SERVER_ID_I = makeInterface<string>({
  name: 'WebSocketServerIdI',
});

/**
 * @category Interface
 */
export const PLATFORM_MOUNTER_I = makeInterface<
  WebSocketPlatformMounter<any, any>
>({
  name: 'WebSocketPlatformMounterI',
});

/**
 * @category Interface
 */
export const PLATFORM_CONFIGS_I = makeInterface<
  WebSocketPlatformConfigs<any, any>
>({ name: 'WebSocketPlatformConfigsI' });

export abstract class WebSocketClusterBroker {
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

/**
 * @category Interface
 */
export const BrokerI = abstractInterface<WebSocketClusterBroker>({
  name: 'WebSocketClusterBrokerI',
})(WebSocketClusterBroker);

export type BrokerI = WebSocketClusterBroker;
