import type { RecognitionData } from '@sociably/core/base/IntentRecognizer.js';

export type RegexRecognitionConfigs<
  Language extends string,
  Intent extends string,
> = {
  recognitionData: RecognitionData<Language, Intent>;
};
