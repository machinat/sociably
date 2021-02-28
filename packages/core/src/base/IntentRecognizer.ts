import type { MachinatChannel } from '../types';
import { makeInterface } from '../service';

export interface DetectIntentResult<Payload> {
  type?: string;
  confidence: number;
  payload: Payload;
}

/**
 * @category Base
 */
export interface BaseIntentRecognizer<Payload> {
  detectText(
    channel: MachinatChannel,
    text: string
  ): Promise<DetectIntentResult<Payload>>;
}

const IntentRecognizerI = makeInterface<BaseIntentRecognizer<unknown>>({
  name: 'BaseIntentRecognizer',
});

type IntentRecognizerI<Payload> = BaseIntentRecognizer<Payload>;

export default IntentRecognizerI;
