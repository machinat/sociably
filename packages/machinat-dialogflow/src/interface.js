// @flow
/* eslint-disable class-methods-use-this */
import { makeInterface, abstractInterface } from '@machinat/core/service';
import type { DialogFlowModuleConfigs } from './types';

export const MODULE_CONFIGS_I = makeInterface<DialogFlowModuleConfigs>({
  name: 'DialogFlowModuleConfigs',
});

class AbstractDialogFlowClient {
  sessionPath(_projectId: string, _sessionId: string): Object {
    throw new TypeError('method called on abstract class');
  }

  detectIntent(_opions: {
    session: Object,
    queryInput: Object,
    queryParams: Object,
  }): Object {
    throw new TypeError('method called on abstract class');
  }
}

export const DialogFlowClientI = abstractInterface<AbstractDialogFlowClient>({
  name: 'DialogFlowClient',
})(AbstractDialogFlowClient);
