import { makeInterface } from '@machinat/core/service';
import type { ModuleConfigs, SessionClient } from './types';

export const MODULE_CONFIGS_I = makeInterface<ModuleConfigs>({
  name: 'DialogFlowModuleConfigs',
});

export const SESSION_CLIENT_I = makeInterface<SessionClient>({
  name: 'DialogFlowSessionClient',
});
