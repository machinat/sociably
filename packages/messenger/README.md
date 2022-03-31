# Messenger Platform

Receive events and send messages through [Messenger platform](https://developers.facebook.com/docs/messenger-platform/).

## Install

```bash
npm install @machinat/core @machinat/http @machinat/messenger
# or with yarn
yarn add @machinat/core @machinat/http @machinat/messenger
```

## Docs

Check the [platform document](https://machinat.com/docs/messenger-platform)
and the [package reference](https://machinat.com/api/modules/messenger.html).

## Setup

```ts
import Machinat from '@machinat/core';
import Http from '@machinat/http';
import Messenger from '@machinat/messenger';

const {
  MESSENGER_PAGE_ID,
  MESSENGER_APP_ID,
  MESSENGER_ACCESS_TOKEN,
  MESSENGER_APP_SECRET,
  MESSENGER_VERIFY_TOKEN,
} = process.env;

const app = Machinat.createApp({
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
