import { makeInterface } from '@machinat/core/service';
import type { ServerAuthorizer, AuthModuleConfigs } from './types';

export const STATE_COOKIE_KEY = 'machinat_auth_state';
export const TOKEN_COOKIE_KEY = 'machinat_auth_token';
export const SIGNATURE_COOKIE_KEY = 'machinat_auth_signature';
export const ERROR_COOKIE_KEY = 'machinat_auth_error';

export const SERVER_AUTHORIZERS_I = makeInterface<ServerAuthorizer<any, any>[]>(
  { name: 'ServerAuthorizersList', multi: true }
);

export const MODULE_CONFIGS_I = makeInterface<AuthModuleConfigs>({
  name: 'AuthModuleConfigs',
});
