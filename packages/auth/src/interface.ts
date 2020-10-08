import { makeInterface } from '@machinat/core/service';
import type { ServerAuthorizer, AuthModuleConfigs } from './types';

/** @category Interface */
export const AUTHORIZERS_I = makeInterface<
  ServerAuthorizer<any, any, any, any>[]
>({
  name: 'AuthAuthorizersListI',
  multi: true,
});

/** @category Interface */
export const MODULE_CONFIGS_I = makeInterface<AuthModuleConfigs>({
  name: 'AuthModuleConfigsI',
});
