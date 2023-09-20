import type { ServiceModule } from '@sociably/core';
import IntentRecognizerI from '@sociably/core/base/IntentRecognizer';

import RecognizerP from './recognizer.js';
import { ConfigsI } from './interface.js';

/** @category Root */
namespace Dialogflow {
  export const Recognizer = RecognizerP;
  export type Recognizer = RecognizerP;

  export const Configs = ConfigsI;
  export type Configs = ConfigsI;

  export const initModule = (configs: ConfigsI): ServiceModule => ({
    provisions: [
      RecognizerP,
      { provide: IntentRecognizerI, withProvider: RecognizerP },
      { provide: ConfigsI, withValue: configs },
    ],
  });
}

export default Dialogflow;
