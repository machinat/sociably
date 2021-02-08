import { SessionsClient } from '@google-cloud/dialogflow';
import { makeFactoryProvider } from '@machinat/core/service';
import IntentRecognizerI from '@machinat/core/base/IntentRecognizer';
import type { ServiceModule } from '@machinat/core/types';

import { IntentRecognizerP } from './recognizer';
import { ConfigsI, SessionClientI } from './interface';

/** @internal */
const dialogflowClientFactory = makeFactoryProvider({
  lifetime: 'transient',
  deps: [ConfigsI] as const,
})((configs) => new SessionsClient(configs.gcpAuthConfig));

/**
 * @category Root
 */
const Dialogflow = {
  IntentRecognizer: IntentRecognizerP,
  SessionClient: SessionClientI,
  Configs: ConfigsI,

  initModule: (configs: ConfigsI): ServiceModule => ({
    provisions: [
      IntentRecognizerP,
      { provide: IntentRecognizerI, withProvider: IntentRecognizerP },
      {
        provide: SessionClientI,
        withProvider: dialogflowClientFactory,
      },
      { provide: ConfigsI, withValue: configs },
    ],
  }),
};

/**
 * @category Root
 */
declare namespace Dialogflow {
  export type IntentRecognizer = IntentRecognizerP;
  export type Configs = ConfigsI;
  export type SessionClient = SessionClientI;
}

export default Dialogflow;
