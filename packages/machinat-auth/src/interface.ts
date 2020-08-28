import { makeInterface } from '@machinat/core/service';
import type { ServerAuthorizer, AuthModuleConfigs } from './types';

/** @category Interface */
export const SERVER_AUTHORIZERS_I = makeInterface<ServerAuthorizer<any, any>[]>(
  { name: 'ServerAuthorizersList', multi: true }
);

/** @category Interface */
export const MODULE_CONFIGS_I = makeInterface<AuthModuleConfigs>({
  name: 'AuthModuleConfigs',
});
