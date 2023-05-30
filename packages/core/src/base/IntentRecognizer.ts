import type { SociablyThread } from '../types.js';
import { serviceInterface } from '../service/index.js';

export type RecognitionData<
  Language extends string = string,
  Intent extends string = string
> = {
  defaultLanguage: Language;
  languages: Language[];
  intents: {
    [Name in Intent]: {
      trainingPhrases: {
        [Code in Language]: string[];
      };
    };
  };
};

export type DetectIntentResult<
  Recognition extends RecognitionData<string, string>,
  Payload
> = Recognition extends RecognitionData<infer Language, infer Intent>
  ? {
      type: undefined | Intent;
      language: Language;
      confidence: number;
      payload: Payload;
    }
  : never;

export type DetectTextOptions = {
  language?: string;
};

/**
 * @category Base
 */
export interface IntentRecognizer<
  Recognition extends RecognitionData<string, string> = RecognitionData<
    string,
    string
  >,
  Payload = unknown
> {
  detectText(
    thread: SociablyThread,
    text: string,
    options?: DetectTextOptions
  ): Promise<DetectIntentResult<Recognition, Payload>>;
}

const IntentRecognizerI = serviceInterface<IntentRecognizer>({
  name: 'IntentRecognizer',
});

type IntentRecognizerI<
  Recognition extends RecognitionData<string, string> = RecognitionData<
    string,
    string
  >,
  Payload = unknown
> = IntentRecognizer<Recognition, Payload>;

export default IntentRecognizerI;
