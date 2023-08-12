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
  TWITTER_USER_ID,
  TWITTER_ACCESS_TOKEN,
  TWITTER_TOKEN_SECRET,
  TWITTER_APP_KEY,
  TWITTER_APP_SECRET,
  TWITTER_BEARER_TOKEN,
} = process.env;

const app = Sociably.createApp({
  modules: [
    Http.initModule({ /* ... */ }),
  ],
  platforms: [
    Twitter.initModule({
      webhookPath: 'webhook/twitter',
      agentSettings: {
        userId: TWITTER_USER_ID,
        accessToken: TWITTER_ACCESS_TOKEN,
        tokenSecret: TWITTER_TOKEN_SECRET,
      },
      appKey: TWITTER_APP_KEY,
      appSecret: TWITTER_APP_SECRET,
      bearerToken: TWITTER_BEARER_TOKEN,
    }),
  ],
});
```
