# DialogFlow Module

This module implement the [`BaseIntentRecognizer`](https://machinat.com/api/modules/core_base_intentrecognizer.html)
interface with [DialogFlow ES](https://cloud.google.com/dialogflow/es/docs) API.

For now you have to create and manage an agent on [DialogFlow ES console](https://dialogflow.cloud.google.com)
by your own. We'll provide a more easy way to manage resources on DialogFlow in
the future.

## Install

```bash
npm install @machinat/core @machinat/dialogflow
# or with yarn
yarn add @machinat/core @machinat/dialogflow
```

## Docs

Check the [Recognizing Intent](https://machinat.com/docs/recognizing-intent)
document for the usage guide, and [package references](https://machinat.com/api/modules/dialogflow.html)
for API details.

## Setup

First you have to prepare a ready-to-use DialogFlow agent to recognize intent
through API. You can follow [this guide](https://cloud.google.com/dialogflow/es/docs/quick/build-agent)
to create one and configure your intents to use.

Next follow [this guide](https://cloud.google.com/dialogflow/es/docs/quick/setup#auth)
to create a service account and set the `GOOGLE_APPLICATION_CREDENTIALS`
environment variable.

Then you can register the module like this:

```js
import Machinat from '@machinat/core';
import DialogFlow from '@machinat/dialogflow';

const { DIALOG_FLOW_PROJECT_ID } = process.env;

const app = Machinat.createApp({
  modules: [
    DialogFlow.initModule({
      projectId: DIALOG_FLOW_PROJECT_ID,
      defaultLanguageCode: 'en-US',
    }),
  ],
});
```
