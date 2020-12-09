import type { MachinatChannel } from '../types';
import { makeInterface } from '../service';

export interface TextIntentDetectResult<Payload> {
  intentType?: string;
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
  ): Promise<TextIntentDetectResult<Payload>>;
}

export const IntentRecognizerI = makeInterface<BaseIntentRecognizer<unknown>>({
  name: 'BaseIntentRecognizerI',
});

export type IntentRecognizerI<Payload> = BaseIntentRecognizer<Payload>;
