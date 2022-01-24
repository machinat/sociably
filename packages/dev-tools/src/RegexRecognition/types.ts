import type { RecognitionData } from '@machinat/core/base/IntentRecognizer';

export type RegexRecognitionConfigs<
  Language extends string,
  Intent extends string
> = {
  recognitionData: RecognitionData<Language, Intent>;
};
