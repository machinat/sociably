import { makeInterface } from '@machinat/core/service';
import type { AnyServerAuthorizer, AuthConfigs } from './types';

/** @category Interface */
export const AuthorizerList = makeInterface<AnyServerAuthorizer>({
  name: 'AuthAuthorizerList',
  multi: true,
});

export type AuthorizerList = AnyServerAuthorizer[];

/** @category Interface */
export const ConfigsI = makeInterface<AuthConfigs>({
  name: 'AuthConfigsI',
});

export type ConfigsI = AuthConfigs;
