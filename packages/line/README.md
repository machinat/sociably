# Line Platform

Receive events and send messages through [LINE](https://developers.line.biz/en/docs/messaging-api/overview/)
messaging API.

## Install

```bash
npm install @machinat/core @machinat/http @machinat/line
# or with yarn
yarn add @machinat/core @machinat/http @machinat/line
```

## Docs

Check the [platform document](https://machinat.com/docs/line-platform) and
[package reference](https://machinat.com/api/modules/line.html).

## Setup

```ts
import Machinat from '@machinat/core';
import Http from '@machinat/http';
import Line from '@machinat/line';

const {
  LINE_PROVIDER_ID,
  LINE_CHANNEL_ID,
  LINE_ACCESS_TOKEN,
  LINE_CHANNEL_SECRET,
} = process.env;

const app = Machinat.createApp({
  modules: [
    Http.initModule({ /* ... */ }),
  ],
  platforms: [
    Line.intiModule({
      webhookPath: '/webhook/line',
      providerId: LINE_PROVIDER_ID,
      channelId: LINE_CHANNEL_ID,
      accessToken: LINE_ACCESS_TOKEN,
      channelSecret: LINE_CHANNEL_SECRET,
    }),
  ],
});
```
