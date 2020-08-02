// @flow
import { SessionsClient } from 'dialogflow';
import { factory } from '@machinat/core/service';
import Base from '@machinat/core/base';
import type { ServiceModule } from '@machinat/core/types';
import IntentRecognizer from './recognizer';
import { DialogFlowClientI, MODULE_CONFIGS_I } from './interface';
import type { DialogFlowModuleConfigs } from './types';

const dialogFlowClientFactory = factory<DialogFlowClientI>({
  lifetime: 'transient',
  deps: [MODULE_CONFIGS_I],
})(
  (configs: DialogFlowModuleConfigs) =>
    new SessionsClient(configs.gcpAuthConfig)
);

const DialogFlow = {
  IntentRecognizer,
  ClientI: DialogFlowClientI,
  CONFIGS_I: MODULE_CONFIGS_I,

  initModule: (configs: DialogFlowModuleConfigs): ServiceModule => ({
    provisions: [
      IntentRecognizer,
      { provide: Base.IntentRecognizerI, withProvider: IntentRecognizer },
      { provide: DialogFlowClientI, withProvider: dialogFlowClientFactory },
      { provide: MODULE_CONFIGS_I, withValue: configs },
    ],
  }),
};

export default DialogFlow;
