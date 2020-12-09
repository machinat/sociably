import { SessionsClient } from '@google-cloud/dialogflow';
import { makeFactoryProvider } from '@machinat/core/service';
import { BaseIntentRecognizerI } from '@machinat/core/base';
import type { ServiceModule } from '@machinat/core/types';

import { IntentRecognizerP } from './recognizer';
import { SESSION_CLIENT_I, MODULE_CONFIGS_I } from './interface';
import type { ModuleConfigs } from './types';

/** @internal */
const dialogflowClientFactory = makeFactoryProvider({
  lifetime: 'transient',
  deps: [MODULE_CONFIGS_I] as const,
})((configs) => new SessionsClient(configs.gcpAuthConfig));

const Dialogflow = {
  IntentRecognizer: IntentRecognizerP,
  SESSION_CLIENT_I,
  CONFIGS_I: MODULE_CONFIGS_I,

  initModule: (configs: ModuleConfigs): ServiceModule => ({
    provisions: [
      IntentRecognizerP,
      { provide: BaseIntentRecognizerI, withProvider: IntentRecognizerP },
      { provide: SESSION_CLIENT_I, withProvider: dialogflowClientFactory },
      { provide: MODULE_CONFIGS_I, withValue: configs },
    ],
  }),
};

declare namespace Dialogflow {
  export type IntentRecognizer = IntentRecognizerP;
}

export default Dialogflow;
