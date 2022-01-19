import type { ServiceModule } from '@machinat/core';
import IntentRecognizerI from '@machinat/core/base/IntentRecognizer';
import RecognizerP from './recognizer';
import { ConfigsI } from './interface';
import { RegexIntentRecognitionConfigs } from './types';

/**
 * @category Root
 */
namespace RegexIntentRecognition {
  export const Recognizer = RecognizerP;
  export type Recognizer<Languages extends string> = RecognizerP<Languages>;

  export const Configs = ConfigsI;
  export type Configs = ConfigsI;

  export const initModule = <Languages extends string>(
    configs: RegexIntentRecognitionConfigs<Languages>
  ): ServiceModule => ({
    provisions: [
      RecognizerP,
      { provide: IntentRecognizerI, withProvider: RecognizerP },
      { provide: ConfigsI, withValue: configs },
    ],
  });
}

export default RegexIntentRecognition;
