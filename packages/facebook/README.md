# Facebook Platform

Receive events and send messages through [Facebook platform](https://developers.facebook.com/docs/facebook-platform/).

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
  FACEBOOK_PAGE_ID,
  FACEBOOK_APP_ID,
  FACEBOOK_ACCESS_TOKEN,
  FACEBOOK_APP_SECRET,
  FACEBOOK_VERIFY_TOKEN,
} = process.env;

const app = Sociably.createApp({
  modules: [
    Http.initModule({ /* ... */ }),
  ],
  platforms: [
    Facebook.intiModule({
      entryPath: '/webhook/facebook',
      pageId: FACEBOOK_PAGE_ID,
      appSecret: FACEBOOK_APP_SECRET,
      accessToken: FACEBOOK_ACCESS_TOKEN,
      verifyToken: FACEBOOK_VERIFY_TOKEN,
    }),
  ],
});
```
