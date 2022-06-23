# Script Module

Control conversation flow with programming language styled script.

## Install

```bash
npm install @sociably/core @sociably/http @sociably/script
# or with yarn
yarn add @sociably/core @sociably/http @sociably/script
```

## Docs

Check the [Dialog Script](https://sociably.js.org/docs/dialog-script)
document and the [package reference](https://sociably.js.org/api/modules/script.html).

## Setup

Register the built script like this:

```js
import Sociably from '@sociably/core';
import Script from '@sociably/script';
import BeforeSunrise from './scenes/BeforeSunset';
import BeforeSunset from './scenes/BeforeSunset';
import BeforeMidnight from './scenes/BeforeSunset';

const app = Sociably.createApp({
  modules: [
    Script.initModule({
      libs: [
        BeforeSunrise,
        BeforeSunset,
        BeforeMidnight,
      ],
    }),
  ],
});
```
