import { makeInterface } from '@machinat/core/service';
import type { ModuleConfigs, SessionClient } from './types';

/**
 * @category Interface
 */
export const MODULE_CONFIGS_I = makeInterface<ModuleConfigs>({
  name: 'DialogflowModuleConfigsI',
});

/**
 * @category Interface
 */
export const SESSION_CLIENT_I = makeInterface<SessionClient>({
  name: 'DialogflowSessionClientI',
});
