import type { RecognitionData } from '@machinat/core/base/IntentRecognizer';

export type RegexIntentRecognitionConfigs<Languages extends string> = {
  recognitionData: RecognitionData<Languages>;
};
