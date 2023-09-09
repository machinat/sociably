export default (): string => `
import { serviceProviderFactory, IntentRecognizer } from '@sociably/core';
import { ChatEventContext } from '../types.js';

const useIntent =
  (recognizer: IntentRecognizer) =>
  async (event: ChatEventContext['event']) => {
    if (event.type === 'text') {
      const intent = await recognizer.detectText(event.thread, event.text);
      return intent;
    }

    if (event.category === 'callback' && event.callbackData) {
      const { action, ...payload } = JSON.parse(event.callbackData);
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

export default serviceProviderFactory({
  deps: [IntentRecognizer],
})(useIntent);
`;
