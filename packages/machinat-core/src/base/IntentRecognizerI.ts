import type { MachinatChannel } from '../types';
import { abstractInterface } from '../service';

export interface TextIntentDetectResult<Payload> {
  intentType?: string;
  confidence: number;
  payload: Payload;
}

/**
 * @category Base
 */
export abstract class BaseIntentRecognizer<Payload> {
  abstract detectText(
    channel: MachinatChannel,
    text: string
  ): Promise<TextIntentDetectResult<Payload>>;
}

export const IntentRecognizerI = abstractInterface<BaseIntentRecognizer<any>>({
  name: 'BaseIntentRecognizerI',
})(BaseIntentRecognizer);

export type IntentRecognizerI<Payload> = BaseIntentRecognizer<Payload>;
