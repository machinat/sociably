# DialogFlow Module

This module implement the [`IntentRecognizer`](https://machinat.com/api/modules/core_base_intentrecognizer.html)
interface with [DialogFlow ES](https://cloud.google.com/dialogflow/es/docs) API.

## Install

```bash
npm install @machinat/core @machinat/dialogflow
# or with yarn
yarn add @machinat/core @machinat/dialogflow
```

## Docs

Check the [Recognizing Intent](https://machinat.com/docs/recognizing-intent) document and the [API reference](https://machinat.com/api/modules/dialogflow.html).

## Setup

You can use this module in two different modes:

### Delegated Mode

In this mode, the DialogFlow project is managed by the package. You maintain the training data along with the codes, and delegate the configuring procedures to the package.

First you need to create a GCP project and a service account to access the API. Follow [this guide](https://cloud.google.com/dialogflow/es/docs/quick/setup) and set the `GOOGLE_APPLICATION_CREDENTIALS` environment variable when running your app.

Then add `@machinat/dialogflow` module like this:

```js
import Machinat from '@machinat/core';
import DialogFlow from '@machinat/dialogflow';

const app = Machinat.createApp({
  modules: [
    DialogFlow.initModule({
      projectId: '_YOUR_DIALOGFLOW_PROJECT_ID_',
      recognitionData: {
        defaultLanguage: 'en',
        languages: ['en'],
        intents: {
          greeting: {
            trainingPhrases: {
              en: ['hello', 'hi']
            }
          }
        },
      },
    }),
  ],
});
```

Finally you have to call `DialogFlowRecognizer.train()` method every time you update the intents data. Like:

```js
// cli/updateDialogFlow.js
import Machinat from '@machinat/core';
import DialogFlow from '@machinat/dialogflow';

const app = Machinat.createApp({/* ... */});
app
  .start()
  .then(() => {
    const [recognizer] = app.useServices([DialogFlow.Recognizer]);
    return recognizer.train();
  });
```

It's recommended to run this every time you deploy a new version of your app. It'll not retrain if the intents data remain the same, so it's really cheap to call.

### Manual Mode

In this mode, you have to manage the DialogFlow project on your own. The package only works as a client for detecting intents.

First you have to prepare a ready-to-use DialogFlow agent. You can follow [this guide](https://cloud.google.com/dialogflow/es/docs/quick/build-agent) to create one and add the intents in the DialogFlow console.

Next follow [this section](https://cloud.google.com/dialogflow/es/docs/quick/setup#auth) to create a service account and set the `GOOGLE_APPLICATION_CREDENTIALS` environment variable.

Then add `@machinat/dialogflow` module like this:

```js
import Machinat from '@machinat/core';
import DialogFlow from '@machinat/dialogflow';

const app = Machinat.createApp({
  modules: [
    DialogFlow.initModule({
      projectId: '_YOUR_DIALOGFLOW_PROJECT_ID_',
      // prevent package to edit the project
      manualMode: true,
      // detect intent with the default agent in dev
      useDefaultAgent: process.env.NODE_ENV !== 'production',
      // specify the environment to be used on production
      environment: 'production',
      recognitionData: {
        defaultLanguage: 'en',
        languages: ['en'],
        intents: {},
      },
    }),
  ],
});
```

If you call `DialogFlowRecognizer.train()` method under manual mode, it creates a snapshot version on the environment. You can do it every time you deploy a new version of app, so the DialogFlow agent would have a revertible version along with the version of app.
