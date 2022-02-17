# Script Module

Control conversation flow with programming language styled script.

## Install

```bash
npm install @machinat/core @machinat/http @machinat/script
# or with yarn
yarn add @machinat/core @machinat/http @machinat/script
```

## Docs

Check the [Dialog Script](https://machinat.com/docs/dialog-script)
document and the [package reference](https://machinat.com/api/modules/script.html).

## Setup

Register the built script like this:

```js
import Machinat from '@machinat/core';
import Script from '@machinat/script';
import BeforeSunrise from './scenes/BeforeSunset';
import BeforeSunset from './scenes/BeforeSunset';
import BeforeMidnight from './scenes/BeforeSunset';

const app = Machinat.createApp({
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
