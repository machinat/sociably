import { serviceInterface } from '@sociably/core/service';
import type { AnyServerAuthenticator, AuthConfigs } from './types.js';

/** @category Interface */
export const AuthenticatorListI = serviceInterface<AnyServerAuthenticator>({
  name: 'AuthAuthenticatorList',
  multi: true,
});

export type AuthenticatorListI = AnyServerAuthenticator[];

/** @category Interface */
export const ConfigsI = serviceInterface<AuthConfigs>({
  name: 'AuthConfigs',
});

export type ConfigsI = AuthConfigs;
