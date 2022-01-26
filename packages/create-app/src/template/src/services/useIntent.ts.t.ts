import { when, polishFileContent } from '../../../utils';
import { CreateAppContext } from '../../../types';

export default ({ platforms }: CreateAppContext) =>
  polishFileContent(`
import { makeFactoryProvider, IntentRecognizer } from '@machinat/core';
import { ChatEventContext } from '../types';

const useIntent =
  (recognizer: IntentRecognizer) =>
  async (event: ChatEventContext['event']) => {
    if (event.type === 'text') {
      const intent = await recognizer.detectText(event.channel, event.text);
      return intent;
    }

    if (${`${when(platforms.includes('messenger'))`
      (event.platform === 'messenger' &&
        (event.type === 'quick_reply' || event.type === 'postback')) ||`}${when(
      platforms.includes('telegram')
    )`
      (event.platform === 'telegram' && event.type === 'callback_query') ||`}${when(
      platforms.includes('line')
    )`
      (event.platform === 'line' && event.type === 'postback') ||`}`.slice(
      0,
      -3
    )}
    ) {
      if (event.data) {
        const { action, ...payload } = JSON.parse(event.data);
        return {
          type: action,
          confidence: 1,
          payload,
        };
      }
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
`);
