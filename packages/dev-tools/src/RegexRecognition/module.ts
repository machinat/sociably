import type { ServiceModule } from '@sociably/core';
import IntentRecognizerI, {
  RecognitionData,
} from '@sociably/core/base/IntentRecognizer';
import RecognizerP, { RegexIntentRecognizer } from './recognizer';
import { ConfigsI } from './interface';

/**
 * @category Root
 */
namespace RegexIntentRecognition {
  export const Recognizer = RecognizerP;
  type Recognizer<
    Recognition extends RecognitionData<string, string> = RecognitionData<
      string,
      string
    >
  > = RegexIntentRecognizer<Recognition>;

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

export default RegexIntentRecognition;
