import { SessionsClient } from '@google-cloud/dialogflow';
import { factory } from '@machinat/core/service';
import Base from '@machinat/core/base';
import type { ServiceModule } from '@machinat/core/types';
import IntentRecognizer from './recognizer';
import { SESSION_CLIENT_I, MODULE_CONFIGS_I } from './interface';
import type { ModuleConfigs, SessionClient } from './types';

const dialogFlowClientFactory = factory<SessionClient>({
  lifetime: 'transient',
  deps: [MODULE_CONFIGS_I],
})((configs: ModuleConfigs) => new SessionsClient(configs.gcpAuthConfig));

const DialogFlow = {
  IntentRecognizer,
  SESSION_CLIENT_I,
  CONFIGS_I: MODULE_CONFIGS_I,

  initModule: (configs: ModuleConfigs): ServiceModule => ({
    provisions: [
      IntentRecognizer,
      { provide: Base.IntentRecognizerI, withProvider: IntentRecognizer },
      { provide: SESSION_CLIENT_I, withProvider: dialogFlowClientFactory },
      { provide: MODULE_CONFIGS_I, withValue: configs },
    ],
  }),
};

export default DialogFlow;
