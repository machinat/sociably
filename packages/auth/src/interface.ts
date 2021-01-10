import { makeInterface } from '@machinat/core/service';
import type { AnyServerAuthorizer, AuthModuleConfigs } from './types';

/** @category Interface */
export const AUTHORIZERS_I = makeInterface<AnyServerAuthorizer[]>({
  name: 'AuthAuthorizersListI',
  multi: true,
});

/** @category Interface */
export const MODULE_CONFIGS_I = makeInterface<AuthModuleConfigs>({
  name: 'AuthModuleConfigsI',
});
