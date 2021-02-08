import type { MachinatUser } from '@machinat/core/types';
import { makeInterface } from '@machinat/core/service';
import type {
  WsServer,
  AnyVerifyLoginFn,
  VerifyUpgradeFn,
  WebSocketPlatformMounter,
  WebSocketConfigs,
  WebSocketClusterBroker,
} from './types';

/**
 * @category Interface
 */
export const WsServerI = makeInterface<WsServer>({
  name: 'WebSocketWsServer',
});

export type WsServerI = WsServer;

/**
 * @category Interface
 */
export const UpgradeVerifierI = makeInterface<VerifyUpgradeFn>({
  name: 'WebSocketUpgradeVerifier',
});

export type UpgradeVerifierI = VerifyUpgradeFn;

/**
 * @category Interface
 */
export const LoginVerifierI = makeInterface<AnyVerifyLoginFn>({
  name: 'WebSocketLoginVerifier',
});

export type LoginVerifierI = AnyVerifyLoginFn;

/**
 * @category Interface
 */
export const ServerIdI = makeInterface<string>({
  name: 'WebSocketServerId',
});

/**
 * @category Interface
 */
export const PlatformMounterI = makeInterface<
  WebSocketPlatformMounter<MachinatUser, unknown>
>({
  name: 'WebSocketPlatformMounter',
});

/**
 * @category Interface
 */
export const ConfigsI = makeInterface<WebSocketConfigs<MachinatUser, unknown>>({
  name: 'WebSocketConfigs',
});

export type ConfigsI = WebSocketConfigs<MachinatUser, unknown>;

/**
 * @category Interface
 */
export const BrokerI = makeInterface<WebSocketClusterBroker>({
  name: 'WebSocketClusterBroker',
});

export type BrokerI = WebSocketClusterBroker;
