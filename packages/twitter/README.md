# Twitter Platform

Tweeting and direct messaging on [Twitter](https://twitter.com).

## Install

```bash
npm install @sociably/core @sociably/http @sociably/twitter
# or with yarn
yarn add @sociably/core @sociably/http @sociably/twitter
```

## Docs

Check the [platform document](https://sociably.js.org/docs/twitter-platform)
and the [package reference](https://sociably.js.org/api/modules/twitter.html).

## Setup

```ts
import Sociably from '@sociably/core';
import Http from '@sociably/http';
import Twitter from '@sociably/twitter';

const {
} = process.env;

const app = Sociably.createApp({
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
