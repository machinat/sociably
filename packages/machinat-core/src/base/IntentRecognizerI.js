// @flow
/* eslint-disable class-methods-use-this, no-unused-vars */
import { abstractInterface } from '../service';
import { MachinatChannel } from '../types';

export interface TextIntentDetectResult {
  intentType?: string;
  confidence: number;
  payload: any;
}

export class AbstractIntentRecognizer {
  detectText(channel: MachinatChannel, text: string): TextIntentDetectResult {
    throw new TypeError('method called on abstract class');
  }
}

export default abstractInterface<AbstractIntentRecognizer>({
  name: 'BaseIntentRecognizer',
})(AbstractIntentRecognizer);
