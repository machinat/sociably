import { SessionsClient } from '@google-cloud/dialogflow';
import { makeFactoryProvider } from '@machinat/core/service';
import Base from '@machinat/core/base';
import type { ServiceModule } from '@machinat/core/types';

import { IntentRecognizerP } from './recognizer';
import {
  ConfigsI as DialogflowConfigsI,
  SessionClientI as DialogflowSessionClientI,
} from './interface';

/** @internal */
const dialogflowClientFactory = makeFactoryProvider({
  lifetime: 'transient',
  deps: [DialogflowConfigsI] as const,
})((configs) => new SessionsClient(configs.gcpAuthConfig));

const Dialogflow = {
  IntentRecognizer: IntentRecognizerP,
  SessionClientI: DialogflowSessionClientI,
  ConfigsI: DialogflowConfigsI,

  initModule: (configs: DialogflowConfigsI): ServiceModule => ({
    provisions: [
      IntentRecognizerP,
      { provide: Base.IntentRecognizerI, withProvider: IntentRecognizerP },
      {
        provide: DialogflowSessionClientI,
        withProvider: dialogflowClientFactory,
      },
      { provide: DialogflowConfigsI, withValue: configs },
    ],
  }),
};

declare namespace Dialogflow {
  export type IntentRecognizer = IntentRecognizerP;
  export type ConfigsI = DialogflowConfigsI;
  export type SessionClientI = DialogflowSessionClientI;
}

export default Dialogflow;
