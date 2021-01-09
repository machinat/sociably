import type { Server as WebScoketServer } from 'ws';
import { makeInterface } from '@machinat/core/service';
import type {
  WebSocketJob,
  VerifyLoginFn,
  VerifyUpgradeFn,
  WebSocketPlatformMounter,
  WebSocketPlatformConfigs,
  ConnIdentifier,
} from './types';

/**
 * @category Interface
 */
export const WS_SERVER_I = makeInterface<WebScoketServer>({
  name: 'WebSocketWSServerI',
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
export const LOGIN_VERIFIER_I = makeInterface<
  VerifyLoginFn<any, unknown, unknown>
>({
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
  WebSocketPlatformMounter<any, unknown>
>({
  name: 'WebSocketPlatformMounterI',
});

/**
 * @category Interface
 */
export const PLATFORM_CONFIGS_I = makeInterface<
  WebSocketPlatformConfigs<any, unknown, unknown>
>({
  name: 'WebSocketPlatformConfigsI',
});

export interface WebSocketClusterBroker {
  start(): Promise<void>;
  stop(): Promise<void>;
  dispatchRemote(job: WebSocketJob): Promise<null | ConnIdentifier[]>;

  subscribeTopicRemote(conn: ConnIdentifier, topic: string): Promise<boolean>;
  unsubscribeTopicRemote(conn: ConnIdentifier, topic: string): Promise<boolean>;

  disconnectRemote(conn: ConnIdentifier): Promise<boolean>;
  onRemoteEvent(handler: (job: WebSocketJob) => void): void;
}

/**
 * @category Interface
 */
export const BrokerI = makeInterface<WebSocketClusterBroker>({
  name: 'WebSocketClusterBrokerI',
});

export type BrokerI = WebSocketClusterBroker;
