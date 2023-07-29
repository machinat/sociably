# WhatsApp Platform

Receive events and send messages on WhatsApp through [Cloud API](https://developers.facebook.com/docs/whatsapp/cloud-api).

## Install

```bash
npm install @sociably/core @sociably/http @sociably/whatsapp
# or with yarn
yarn add @sociably/core @sociably/http @sociably/whatsapp
```

## Docs

Check the [platform document](https://sociably.js.org/docs/whatsapp-platform)
and the [package reference](https://sociably.js.org/api/modules/whatsapp.html).

## Setup

```ts
import Sociably from '@sociably/core';
import Http from '@sociably/http';
import WhatsApp from '@sociably/whatsapp';

const {
  WHATS_APP_ACCESS_TOKEN,
  WHATS_APP_ACCOUNT_ID,
  WHATS_APP_NUMBER_ID,
  WHATS_APP_PHONE_NUMBER,
  WHATS_APP_APP_SECRET,
  WHATS_APP_VERIFY_TOKEN,
} = process.env;

const app = Sociably.createApp({
  modules: [
    Http.initModule({ /* ... */ }),
  ],
  platforms: [
    WhatsApp.intiModule({
      entryPath: '/webhook/whatsapp',
      agentSettings: {
        numberId: WHATS_APP_NUMBER_ID,
        phoneNumber: WHATS_APP_PHONE_NUMBER,
      },
      appSecret: WHATS_APP_APP_SECRET,
      accessToken: WHATS_APP_ACCESS_TOKEN,
      verifyToken: WHATS_APP_VERIFY_TOKEN,
    }),
  ],
});
```
