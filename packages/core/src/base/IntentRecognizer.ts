import type { MachinatChannel } from '../types';
import { makeInterface } from '../service';

export type RecognitionData<Languages extends string = string> = {
  defaultLanguage: Languages;
  languages: Languages[];
  intents: {
    [name: string]: {
      trainingPhrases: { [L in Languages]: string[] };
    };
  };
};

export interface DetectIntentResult<Payload> {
  type?: string;
  confidence: number;
  payload: Payload;
}

export type DetectTextOptions = {
  language?: string;
};

/**
 * @category Base
 */
export interface IntentRecognizer<Payload> {
  detectText(
    channel: MachinatChannel,
    text: string,
    options?: DetectTextOptions
  ): Promise<DetectIntentResult<Payload>>;
}

const IntentRecognizerI = makeInterface<IntentRecognizer<unknown>>({
  name: 'IntentRecognizer',
});

type IntentRecognizerI<Payload> = IntentRecognizer<Payload>;

export default IntentRecognizerI;
