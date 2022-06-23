# Dev Tools Module

This module consists services that is useful for development.

## Install

```bash
npm install @sociably/core @sociably/dev-tools
# or with yarn
yarn add @sociably/core @sociably/dev-tools
```

## Docs

Check the [package references](https://sociably.js.org/api/modules/dev_tools.html).

## Services

### In-Memory State

An in-memory implementation of [`StateController`](https://sociably.js.org/api/modules/core_base_statecontroller.html). Check the [Using State](https://sociably.js.org/docs/using-states) document for usage guides.

#### Setup

```js
import Sociably from '@sociably/core';
import { InMemoryState } from '@sociably/dev-tools';

const app = Sociably.createApp({
  modules: [
    InMemoryState.initModule(),
  ],
});
```

### File State

An implementation of [`StateController`](https://sociably.js.org/api/modules/core_base_statecontroller.html) that stores state data in a local file for easy debugging. Check the [Using State](https://sociably.js.org/docs/using-states) document for usage guides.

#### Setup

```js
import Sociably from '@sociably/core';
import { FileState } from '@sociably/dev-tools';
import YAML from 'yaml';

const app = Sociably.createApp({
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

An simple [`IntentRecognizer`](https://sociably.js.org/api/modules/core_base_intentrecognizer.html)
implementation using `RegExp`.
Check the [Recognizing Intent](https://sociably.js.org/docs/recognizing-intent) document for usage guides.

#### Setup

```js
import Sociably from '@sociably/core';
import { RegexIntentRecognition } from '@sociably/dev-tools';

const app = Sociably.createApp({
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
