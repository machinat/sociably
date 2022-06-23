# Messenger Platform

Receive events and send messages through [Messenger platform](https://developers.facebook.com/docs/messenger-platform/).

## Install

```bash
npm install @sociably/core @sociably/http @sociably/messenger
# or with yarn
yarn add @sociably/core @sociably/http @sociably/messenger
```

## Docs

Check the [platform document](https://sociably.js.org/docs/messenger-platform)
and the [package reference](https://sociably.js.org/api/modules/messenger.html).

## Setup

```ts
import Sociably from '@sociably/core';
import Http from '@sociably/http';
import Messenger from '@sociably/messenger';

const {
  MESSENGER_PAGE_ID,
  MESSENGER_APP_ID,
  MESSENGER_ACCESS_TOKEN,
  MESSENGER_APP_SECRET,
  MESSENGER_VERIFY_TOKEN,
} = process.env;

const app = Sociably.createApp({
  modules: [
    Http.initModule({ /* ... */ }),
  ],
  platforms: [
    Messenger.intiModule({
      entryPath: '/webhook/messenger',
      pageId: MESSENGER_PAGE_ID,
      appSecret: MESSENGER_APP_SECRET,
      accessToken: MESSENGER_ACCESS_TOKEN,
      verifyToken: MESSENGER_VERIFY_TOKEN,
    }),
  ],
});
```
