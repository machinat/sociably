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
  name: 'WebSocketWsServerI',
});

export type WsServerI = WsServer;

/**
 * @category Interface
 */
export const UpgradeVerifierI = makeInterface<VerifyUpgradeFn>({
  name: 'WebSocketUpgradeVerifierI',
});

export type UpgradeVerifierI = VerifyUpgradeFn;

/**
 * @category Interface
 */
export const LoginVerifierI = makeInterface<AnyVerifyLoginFn>({
  name: 'WebSocketLoginVerifierI',
});

export type LoginVerifierI = AnyVerifyLoginFn;

/**
 * @category Interface
 */
export const ServerIdI = makeInterface<string>({
  name: 'WebSocketServerIdI',
});

/**
 * @category Interface
 */
export const PlatformMounterI = makeInterface<
  WebSocketPlatformMounter<any, unknown>
>({
  name: 'WebSocketPlatformMounterI',
});

/**
 * @category Interface
 */
export const ConfigsI = makeInterface<WebSocketConfigs<any, unknown>>({
  name: 'WebSocketConfigsI',
});

export type ConfigsI = WebSocketConfigs<any, unknown>;

/**
 * @category Interface
 */
export const BrokerI = makeInterface<WebSocketClusterBroker>({
  name: 'WebSocketClusterBrokerI',
});

export type BrokerI = WebSocketClusterBroker;
