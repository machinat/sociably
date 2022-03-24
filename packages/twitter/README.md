# Twitter Platform

Tweeting and direct messaging on [Twitter](https://twitter.com).

## Install

```bash
npm install @machinat/core @machinat/http @machinat/twitter
# or with yarn
yarn add @machinat/core @machinat/http @machinat/twitter
```

## Docs

Check the [platform document](https://machinat.com/docs/twitter-platform)
and the [package reference](https://machinat.com/api/modules/twitter.html).

## Setup

```ts
import Machinat from '@machinat/core';
import Http from '@machinat/http';
import Twitter from '@machinat/twitter';

const {
} = process.env;

const app = Machinat.createApp({
  modules: [
    Http.initModule({ /* ... */ }),
  ],
  platforms: [
    Twitter.intiModule({
      entryPath: '/webhook/twitter',
    }),
  ],
});
```
