import type { MachinatChannel } from '../types';
import { abstractInterface } from '../service';

export interface TextIntentDetectResult<Payload> {
  intentType?: string;
  confidence: number;
  payload: Payload;
}

export abstract class BaseIntentRecognizer<Payload> {
  abstract detectText(
    channel: MachinatChannel,
    text: string
  ): Promise<TextIntentDetectResult<Payload>>;
}

export default abstractInterface<BaseIntentRecognizer<any>>({
  name: 'BaseIntentRecognizerI',
})(BaseIntentRecognizer);
