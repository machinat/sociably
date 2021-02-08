import { makeInterface } from '@machinat/core/service';
import type { AnyServerAuthorizer, AuthConfigs } from './types';

/** @category Interface */
export const AuthorizerListI = makeInterface<AnyServerAuthorizer>({
  name: 'AuthAuthorizerList',
  multi: true,
});

export type AuthorizerListI = AnyServerAuthorizer[];

/** @category Interface */
export const ConfigsI = makeInterface<AuthConfigs>({
  name: 'AuthConfigs',
});

export type ConfigsI = AuthConfigs;
