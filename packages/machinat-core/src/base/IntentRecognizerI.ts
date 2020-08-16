import type { MachinatChannel } from '../types';
import { abstractInterface } from '../service';

export interface TextIntentDetectResult<Payload> {
  intentType?: string;
  confidence: number;
  payload: Payload;
}

@abstractInterface<IntentRecognizerI<any>>({
  name: 'BaseIntentRecognizer',
})
abstract class IntentRecognizerI<Payload> {
  abstract detectText(
    channel: MachinatChannel,
    text: string
  ): Promise<TextIntentDetectResult<Payload>>;
}

export default IntentRecognizerI;
