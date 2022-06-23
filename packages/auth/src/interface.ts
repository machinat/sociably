import { makeInterface } from '@sociably/core/service';
import type { AnyServerAuthenticator, AuthConfigs } from './types';

/** @category Interface */
export const AuthenticatorListI = makeInterface<AnyServerAuthenticator>({
  name: 'AuthAuthenticatorList',
  multi: true,
});

export type AuthenticatorListI = AnyServerAuthenticator[];

/** @category Interface */
export const ConfigsI = makeInterface<AuthConfigs>({
  name: 'AuthConfigs',
});

export type ConfigsI = AuthConfigs;
