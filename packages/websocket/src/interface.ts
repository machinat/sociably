import type { SociablyUser } from '@sociably/core';
import { serviceInterface } from '@sociably/core/service';
import type {
  WsServer,
  AnyVerifyLoginFn,
  VerifyUpgradeFn,
  WebSocketPlatformUtilities,
  WebSocketConfigs,
  WebSocketClusterBroker,
} from './types.js';

/** @category Interface */
export const WsServerI = serviceInterface<WsServer>({
  name: 'WebSocketWsServer',
});

export type WsServerI = WsServer;

/** @category Interface */
export const UpgradeVerifierI = serviceInterface<VerifyUpgradeFn>({
  name: 'WebSocketUpgradeVerifier',
});

export type UpgradeVerifierI = VerifyUpgradeFn;

/** @category Interface */
export const LoginVerifierI = serviceInterface<AnyVerifyLoginFn>({
  name: 'WebSocketLoginVerifier',
});

export type LoginVerifierI = AnyVerifyLoginFn;

/** @category Interface */
export const ServerIdI = serviceInterface<string>({
  name: 'WebSocketServerId',
});

/** @category Interface */
export const PlatformUtilitiesI = serviceInterface<
  WebSocketPlatformUtilities<SociablyUser, unknown>
>({
  name: 'WebSocketPlatformUtilities',
});

/** @category Interface */
export const ConfigsI = serviceInterface<
  WebSocketConfigs<SociablyUser, unknown>
>({
  name: 'WebSocketConfigs',
});

export type ConfigsI = WebSocketConfigs<SociablyUser, unknown>;

/** @category Interface */
export const BrokerI = serviceInterface<WebSocketClusterBroker>({
  name: 'WebSocketClusterBroker',
});

export type BrokerI = WebSocketClusterBroker;
