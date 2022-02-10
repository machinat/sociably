# Dev Tools Module

This module consists services that is useful for development.

## Install

```bash
npm install @machinat/core @machinat/dev-tools
# or with yarn
yarn add @machinat/core @machinat/dev-tools
```

## Docs

Check the [package reference](https://machinat.com/api/modules/dev_tools.html) for API details.

## Services

### In-Memory State

An in-memory implementation of [`StateController`](https://machinat.com/api/modules/core_base_statecontroller.html). Check the [Using State](https://machinat.com/docs/using-states) document for usage guides.

#### Setup

```js
import Machinat from '@machinat/core';
import { InMemoryState } from '@machinat/dev-tools';

const app = Machinat.createApp({
  modules: [
    InMemoryState.initModule(),
  ],
});
```

### File State

An implementation of [`StateController`](https://machinat.com/api/modules/core_base_statecontroller.html) that stores state data in a local file for easy debugging. Check the [Using State](https://machinat.com/docs/using-states) document for usage guides.

#### Setup

```js
import Machinat from '@machinat/core';
import { FileState } from '@machinat/dev-tools';
import YAML from 'yaml';

const app = Machinat.createApp({
  modules: [
    FileState.initModule({
      path: './.state_storage.json',
    }),
  ],
  services: [
    // you can swap the serializer
    { provide: FileState.Serializer, withValue: YAML }
  ],
});
```

### RegExp Intent Recognition

An simple [`IntentRecognizer`](https://machinat.com/api/modules/core_base_intentrecognizer.html)
implementation using `RegExp`.
Check the [Recognizing Intent](https://machinat.com/docs/recognizing-intent) document for usage guides.

#### Setup

```js
import Machinat from '@machinat/core';
import { RegexIntentRecognition } from '@machinat/dev-tools';

const app = Machinat.createApp({
  modules: [
    RegexIntentRecognition.initModule({
      recognitionData: {
        defaultLanguage: 'en',
        languages: ['en', 'ja'],
        intents: {
          hello: {
            trainingPhrases: {
              en: ['hello', 'hi'],
              ja: ['こんにちは', 'おはよう'],
            },
          },
          goodBye: {
            trainingPhrases: {
              en: ['bye', 'see ya'],
              ja: ['さようなら'],
            },
          },
        },
      },
    }),
  ],
});
```
