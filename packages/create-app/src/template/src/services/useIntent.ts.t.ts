export default (): string => `
import { makeFactoryProvider, IntentRecognizer } from '@machinat/core';
import { ChatEventContext } from '../types';

const useIntent =
  (recognizer: IntentRecognizer) =>
  async (event: ChatEventContext['event']) => {
    if (event.type === 'text') {
      const intent = await recognizer.detectText(event.channel, event.text);
      return intent;
    }

    if ('data' in event && event.data) {
      const { action, ...payload } = JSON.parse(event.data);
      return {
        type: action,
        confidence: 1,
        payload,
      };
    }

    return {
      type: undefined,
      confidence: 0,
      payload: null,
    };
  };

export default makeFactoryProvider({
  deps: [IntentRecognizer],
})(useIntent);
`;
