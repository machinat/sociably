// @flow
import { namedInterface, abstractInterface } from '@machinat/core/service';
import type { DialogFlowModuleConfigs } from './types';

export const MODULE_CONFIGS_I = namedInterface<DialogFlowModuleConfigs>({
  name: 'DialogFlowModuleConfigs',
});

class AbstractDialogFlowClient {
  +sessionPath: (projectId: string, sessionId: string) => Object;
  +detectIntent: (opions: {
    session: Object,
    queryInput: Object,
    queryParams: Object,
  }) => Object;
}

export const DialogFlowClientI = abstractInterface<AbstractDialogFlowClient>({
  name: 'DialogFlowClient',
})(AbstractDialogFlowClient);
