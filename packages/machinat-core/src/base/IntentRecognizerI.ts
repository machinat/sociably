import type { MachinatChannel } from '../types';
import { abstractInterface } from '../service';

interface TextIntentDetectResult<Payload> {
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
  ): TextIntentDetectResult<Payload>;
}

export default IntentRecognizerI;
