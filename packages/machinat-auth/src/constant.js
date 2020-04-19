// @flow
import { namedInterface } from '@machinat/core/service';
import type { ServerAuthorizer, AuthModuleConfigs } from './types';

export const STATE_COOKIE_KEY = 'machinat_auth_state';
export const TOKEN_COOKIE_KEY = 'machinat_auth_token';
export const SIGNATURE_COOKIE_KEY = 'machinat_auth_signature';
export const ERROR_COOKIE_KEY = 'machinat_auth_error';

export const AUTH_SERVER_AUTHORIZERS_I = namedInterface<
  ServerAuthorizer<any, any>[]
>({
  name: 'ServerAuthorizersList',
  multi: true,
});

export const AUTH_MODULE_CONFIGS_I = namedInterface<AuthModuleConfigs>({
  name: 'AuthModuleConfigs',
});
