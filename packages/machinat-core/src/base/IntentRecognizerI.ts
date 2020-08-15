import type { MachinatChannel } from '../types';
import { abstractInterface } from '../service';

interface TextIntentDetectResult<Payload> {
  intentType?: string;
  confidence: number;
  payload: Payload;
}

export abstract class AbstractIntentRecognizer<Payload> {
  abstract detectText(
    channel: MachinatChannel,
    text: string
  ): TextIntentDetectResult<Payload>;
}

export default abstractInterface<AbstractIntentRecognizer<any>>({
  name: 'BaseIntentRecognizer',
})(AbstractIntentRecognizer);
