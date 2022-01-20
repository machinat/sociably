import type { ServiceModule } from '@machinat/core';
import IntentRecognizerI from '@machinat/core/base/IntentRecognizer';

import RecognizerP from './recognizer';
import { ConfigsI } from './interface';

/**
 * @category Root
 */
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
