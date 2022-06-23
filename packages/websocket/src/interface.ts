import type { SociablyUser } from '@sociably/core';
import { makeInterface } from '@sociably/core/service';
import type {
  WsServer,
  AnyVerifyLoginFn,
  VerifyUpgradeFn,
  WebSocketPlatformUtilities,
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
export const PlatformUtilitiesI = makeInterface<
  WebSocketPlatformUtilities<SociablyUser, unknown>
>({
  name: 'WebSocketPlatformUtilities',
});

/**
 * @category Interface
 */
export const ConfigsI = makeInterface<WebSocketConfigs<SociablyUser, unknown>>({
  name: 'WebSocketConfigs',
});

export type ConfigsI = WebSocketConfigs<SociablyUser, unknown>;

/**
 * @category Interface
 */
export const BrokerI = makeInterface<WebSocketClusterBroker>({
  name: 'WebSocketClusterBroker',
});

export type BrokerI = WebSocketClusterBroker;
