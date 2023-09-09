# Instagram Platform

Receive chat events and send messages through [Instagram platform](https://developers.facebook.com/docs/messenger-platform/instagram).

## Install

```bash
npm install @sociably/core @sociably/http @sociably/instagram
# or with yarn
yarn add @sociably/core @sociably/http @sociably/instagram
```

## Docs

Check the [platform document](https://sociably.js.org/docs/instagram-platform)
and the [package reference](https://sociably.js.org/api/modules/instagram.html).

## Setup

```ts
import Sociably from '@sociably/core';
import Http from '@sociably/http';
import Instagram from '@sociably/instagram';

const {
  META_APP_ID,
  META_APP_SECRET,
  META_WEBHOOK_VERIFY_TOKEN,
  INSTAGRAM_AGENT_ID,
  INSTAGRAM_PAGE_ID,
  INSTAGRAM_ACCESS_TOKEN,
  INSTAGRAM_AGENT_USERNAME,
} = process.env;

const app = Sociably.createApp({
  modules: [
    Http.initModule({ /* ... */ }),
  ],
  platforms: [
    Instagram.intiModule({
      entryPath: 'webhook/instagram',
      appId: META_APP_ID,
      appSecret: META_APP_SECRET,
      webhookVerifyToken: META_WEBHOOK_VERIFY_TOKEN,
      agentSettings: {
        accountId: INSTAGRAM_AGENT_ID,
        pageId: INSTAGRAM_PAGE_ID,
        accessToken: INSTAGRAM_ACCESS_TOKEN,
        username: INSTAGRAM_AGENT_USERNAME,
      },
    }),
  ],
});
```
