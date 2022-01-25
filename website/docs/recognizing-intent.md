---
title: Recognizing Intent
---

Intent recognition is one essential step to understand your user while building
conversational experiences. Machinat doesn't provide the utility by itself, but
you can easily integrate with any intent recognition service.

## Install

For now, we only support [`DialogFlow`](https://dialogflow.cloud.google.com/) as
the service supplier. Check the [package readme](https://github.com/machinat/machinat/tree/master/packages/dialogflow) for the setup guide. We'll support more intent recognition suppliers in the
future.

## Usage

Using `Base.IntentRecognizer` is the recommended way to recognize intent. The
base interface allows you to change supplier without changing the usage code.

```js
import { makeContainer, IntentRecognizer } from '@machinat/core';

app.onEvent(
  makeContainer({ deps: [IntentRecognizer] })(
    (recognizer) =>
      async ({ reply, event }) => {
        if (event.category === 'message' && event.type === 'text') {
          const intent = await recognizer.detectText(event.channel, event.text);

          if (intent.type === 'marry_me') {
            if (intent.confidence > 0.5) {
              return reply('Yes, I do!');
            } else {
              return reply('Are you kidding!?');
            }
          } else {
            return reply('🙂');
          }
        }
      }
  )
);
```

The `detectText(channel, text)` method detect the intent of text message sent.
It returns a promise of a result object with following information:

- `type` - `undefined | string`, the intent type name returned by the supplier.
   If no intent matched, the value would be `undefined`.
- `confidence` - `number`, the confidence of the recognized intent.
- `payload` - `object`, original result from the supplier.


### Combine Your Own Logic

Sometimes you might want to add your own recognizing logic. For example:
handling quick replies, recognizing emoji or parsing special format. You can
wrap the intent recognizer with your own service, like this:

```js
import { makeFactoryProvider, IntentRecognizer } from '@machinat/core';

const useIntent = makeFactoryProvider({ deps: [IntentRecognizer] })(
  (recognizer) =>
    async (event) => {
      if (event.type === 'quick_reply') {
        const payload = JSON.parse(event.data);
        return { type: payload.type, confidence: 1, payload };
      }
      if (event.type === 'text') {
        const text = event.text.trim();

        if (/^(yes|ok|good|👌|👍)$/i.test(text)) {
          return { type: 'yes', confidence: 1, payload: null };
        }

        const matchFooCommand = text.match(/^\/foo (bar|baz)$/);
        if (matchFooCommand) {
          return { type: 'foo', confidence: 1, payload: matchFooCommand[1] };
        }

        const intent = await recognizer.detectText(event.channel, text);
        return intent;
      }
      return { type: undefined, confidence: 0, payload: null };
    }
);
```

Then use your customized recognizer to detect intent like this:

```js
import { makeContainer } from '@machinat/core';
import useIntent from './useIntent';

app.onEvent(
  makeContainer({ deps: [useIntent] })(
    (getIntent)
      async ({ event }) => {
        const intent = await getIntent(event);
        console.log(intent.type);
      }
  )
);
```

### Specify Supplier

If you need supplier specific features, you can use the implementation provider
directly. For example, use `DialogFlow.IntentRecognizer` like this:

```js
import { makeContainer } from '@machinat/core';
import DialogFlow from '@machinat/dialogflow';

makeContainer({ deps: [DialogFlow.IntentRecognizer] })(
  (recognizer) =>
    async (context) => {
      const intent = await recognizer.detectText(
        event.channel,
        event.text,
        { contexts: ['greeting'] }
      );

      console.log(intent.payload.sentimentAnalysisResult);
    }
)
```
