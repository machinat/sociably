---
title: Intent Recognition
---

Intent recognition is one essential step to understand your user while building conversational UX. Machinat doesn't provide the utility by itself, but you can easily integrate with any suppliers in the market.

## Install

For now we support `DialogFlow` only, check [the package](https://github.com/machinat/machinat/tree/master/packages/dialogflow) for the installation details. There would be more intent recognition suppliers supported in the future.

Add the module into your app like this:

```js
import DialogFlow from '@machinat/dialogflow';

Machinat.createApp({
  ...
  modules: [
    ...
    DialogFlow.initModule({
      projectId: 'xxx-xxx-xxx',
      defaultLanguageCode: 'en-US',
    }),
  ],
})
```

## Usage

Using `Base.IntentRecognizer` is the recommended way to recognize intent. The base interface allows you to change supplier without changing the usage code.

```js
import { container } from '@machinat/core/service';
import IntentRecognizerI from '@machinat/core/base/IntentRecognizerI';

app.onEvent(
  container({
    deps: [IntentRecognizerI],
  })(
    (recognizer) => async ({ reply, event }) => {
      if (event.category === 'message' && event.type === 'text') {
        const { intentType, confidence } = await recognizer.detectText(
          event.channel,
          event.text
        );

        if (intentType === 'marry_me') {
          if (confidence > 0.5) {
            return reply('Yes! I Do!');
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

The `detectText(channel, text)` method detect the intent of the text sent on the channel. It returns a promise resolving a result object with following information:

- `intentType` - `undefined | string`, the intent type name returned by the supplier. If no intent matched, the value would be `undefined`.
- `confidence` - `number`, the confidence of the recognized intent.
- `payload` - `object`, original result from the supplier.

### Specify Supplier

If you need supplier specific features, you can use the implementation interface directly. For example using `DialogFlow.IntentRecognizer` like:

```js
import DialogFlow from '@machinat/dialogflow';

container({
  deps: [DialogFlow.IntentRecognizer],
})((recognizer) => async (context) => {
  const { intentType } = await recognizer.detectText(
    event.channel,
    event.text,
    { contexts: ['first-time'] });
  // ...
})
```

## Next

Learn how to use state service in [next section](using-states.md).
