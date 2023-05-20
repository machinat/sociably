# Telegram Platform

Receive events and send messages through [Telegram](https://developers.facebook.com/docs/telegram-platform/).

## Install

```bash
npm install @sociably/core @sociably/http @sociably/telegram
# or with yarn
yarn add @sociably/core @sociably/http @sociably/telegram
```

## Docs

Check the [platform document](https://sociably.js.org/docs/telegram-platform)
and the [package reference](https://sociably.js.org/api/modules/telegram.html).

## Setup

```ts
import Sociably from '@sociably/core';
import Http from '@sociably/http';
import Telegram from '@sociably/telegram';

const {
  TELEGRAM_BOT_NAME,
  TELEGRAM_BOT_TOKEN,
  TELEGRAM_SECRET_TOKEN,
} = process.env;

const app = Sociably.createApp({
  modules: [
    Http.initModule({ /* ... */ }),
  ],
  platforms: [
    Telegram.intiModule({
      webhookPath: '/webhook/telegram',
      agentSettings: {
        botName: TELEGRAM_BOT_NAME,
        botToken: TELEGRAM_BOT_TOKEN,
        secretToken: TELEGRAM_SECRET_TOKEN,
      },
    }),
  ],
});
```
