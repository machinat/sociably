---
title: Recognizing Intent
---

Recognizing users' intent is essential to interact in a conversation.
Machinat provides a standard interface for intent recognition,
that you can choose any recognition provider you like.

## Install

You have to install one recognition provider package.
For now these packages are officially supported:

- [@machinat/dialogflow](pathname:///api/modules/dialogflow) - detect intent using [`Dialogflow ES`](https://cloud.google.com/dialogflow/es/docs).
- [@machinat/dev-tools](pathname:///api/modules/dev_tools#regexp-intent-recognition) - provide `RegexRecognition`, a simple implementation using `RegExp`. It should only be used for testing or debugging.

Please check the references for the setup guides.
We'll support more recognition suppliers in the future.

## Training Data in Codes

Next, the intents recognition model requires data for training.
The training data can be maintained in codes like this:

```js
// recognitionData.js
export default {
  defaultLanguage: 'en',
  // supported languages 
  languages: ['en'],
  intents: {
    // "yes" intent
    yes: {
      trainingPhrases: {
        // phrases for language "en"
        en: ['yes', 'ok', 'ya', 'nice', 'good', 'cool', 'fine'],
      },
    },
    no: {
      trainingPhrases: {
        en: ['no', 'nope', 'sorry', 'later', 'maybe not'],
      },
    },
  },
};
```

Then pass the recognition data to the provider like:

```js
import recognitionData from './recognitionData';

Machinat.createApp({
  modules:[
    Dialogflow.initModule({
      recognitionData,
      projectId: process.env.DIALOGFLOW_PROJECT_ID,
    }),
    //...
  ],
  //...
});
```

The provider would manage all the model training jobs.
If the data has changed, the model is automatically updated.

You only need to maintain the recognition data in the project,
and the provider will handle the rest of the work.

## Usage

Once you set up the recognition provider,
you can use the `IntentRecognizer` service to detect intent.
For example:

```js
import { makeContainer, IntentRecognizer } from '@machinat/core';

app.onEvent(
  makeContainer({ deps: [IntentRecognizer] })(
    (recognizer) =>
      async ({ reply, event }) => {
        if (event.category === 'message' && event.type === 'text') {
          const { channel, text } = event;
          const intent = await recognizer.detectText(channel, text);

          if (intent.type === 'marry_me') {
            if (intent.confidence > 0.5) {
              return reply('Yes, I do!');
            } else {
              return reply('Are you kidding?');
            }
          } else {
            return reply('🙂');
          }
        }
      }
  )
);
```

`detectText(channel, text)` method detects the intent of a text message.
It returns the result with following info:

- `type` - `undefined | string`, the intent name. If no intent is matched, the value is `undefined`.
- `confidence` - `number`, the confident level of the recognized intent, range 0-1.
- `payload` - `object`, raw result data from the supplier.

The `IntentRecognizer` service can be used no matter which provider you choose.
You don't have to change the recognizing codes if you change the provider.

### Combine Your Own Logic

Sometimes you might want to add your own recognizing logic.
Like handling postback data, recognizing emoji or parsing special formats.
You can make your own recognizing service for that, like:

```js
import { makeFactoryProvider, IntentRecognizer } from '@machinat/core';

const useIntent = makeFactoryProvider({ deps: [IntentRecognizer] })(
  (recognizer) =>
    async (event) => {
      if (event.type === 'postback') {
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

Then use your recognizing service to detect intent like:

```js
import { makeContainer } from '@machinat/core';
import useIntent from './useIntent';

app.onEvent(
  makeContainer({ deps: [useIntent] })(
    (getIntent) =>
    async ({ event }) => {
      const intent = await getIntent(event);
      console.log(intent.type);
    }
  )
);
```

### Use Features from Supplier

If you need features of a specific supplier,
you can use the implementation provider directly.
For example, use `DialogFlow.Recognizer` like this:

```js
import { makeContainer } from '@machinat/core';
import DialogFlow from '@machinat/dialogflow';

makeContainer({ deps: [DialogFlow.Recognizer] })(
  (recognizer) =>
  async (context) => {
    const { channel, text } = context.event;
    const intent = await recognizer.detectText(channel, text, {
      contexts: ['greeting'],
    });

    console.log(intent.payload.sentimentAnalysisResult);
  }
);
```

Note that you can only use the provider you register in the app.
