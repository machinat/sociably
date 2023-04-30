# Line Platform

Receive events and send messages through [LINE](https://developers.line.biz/en/docs/messaging-api/overview/)
messaging API.

## Install

```bash
npm install @sociably/core @sociably/http @sociably/line
# or with yarn
yarn add @sociably/core @sociably/http @sociably/line
```

## Docs

Check the [platform document](https://sociably.js.org/docs/line-platform)
and the [package reference](https://sociably.js.org/api/modules/line.html).

## Setup

```ts
import Sociably from '@sociably/core';
import Http from '@sociably/http';
import Line from '@sociably/line';

const {
  LINE_PROVIDER_ID,
  LINE_CHANNEL_ID,
  LINE_ACCESS_TOKEN,
  LINE_CHANNEL_SECRET,
} = process.env;

const app = Sociably.createApp({
  modules: [
    Http.initModule({ /* ... */ }),
  ],
  platforms: [
    Line.intiModule({
      webhookPath: '/webhook/line',
      channelSettings: {
        providerId: LINE_PROVIDER_ID,
        channelId: LINE_CHANNEL_ID,
        accessToken: LINE_ACCESS_TOKEN,
        channelSecret: LINE_CHANNEL_SECRET,
      },
    }),
  ],
});
```
