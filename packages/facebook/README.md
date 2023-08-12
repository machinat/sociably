# Facebook Platform

Receive events and send messages through [Facebook platform](https://developers.facebook.com/docs/messenger-platform/).

## Install

```bash
npm install @sociably/core @sociably/http @sociably/facebook
# or with yarn
yarn add @sociably/core @sociably/http @sociably/facebook
```

## Docs

Check the [platform document](https://sociably.js.org/docs/facebook-platform)
and the [package reference](https://sociably.js.org/api/modules/facebook.html).

## Setup

```ts
import Sociably from '@sociably/core';
import Http from '@sociably/http';
import Facebook from '@sociably/facebook';

const {
  META_APP_ID,
  META_APP_SECRET,
  META_WEBHOOK_VERIFY_TOKEN,
  FACEBOOK_PAGE_ID,
  FACEBOOK_ACCESS_TOKEN,
} = process.env;

const app = Sociably.createApp({
  modules: [
    Http.initModule({ /* ... */ }),
  ],
  platforms: [
    Facebook.intiModule({
      webhookPath: 'webhook/facebook',
      appId: META_APP_ID,
      appSecret: META_APP_SECRET,
      webhookVerifyToken: META_WEBHOOK_VERIFY_TOKEN,
      agentSettings: {
        pageId: FACEBOOK_PAGE_ID,
        accessToken: FACEBOOK_ACCESS_TOKEN,
      },
    }),
  ],
});
```
