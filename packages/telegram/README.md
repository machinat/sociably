# Telegram Platform

Receive events and send messages through [Telegram](https://developers.facebook.com/docs/telegram-platform/).

## Install

```bash
npm install @machinat/core @machinat/http @machinat/telegram
# or with yarn
yarn add @machinat/core @machinat/http @machinat/telegram
```

## Docs

Check the [platform document](https://machinat.com/docs/telegram-platform)
and the [package reference](https://machinat.com/api/modules/telegram.html).

## Setup

```ts
import Machinat from '@machinat/core';
import Http from '@machinat/http';
import Telegram from '@machinat/telegram';

const { TELEGRAM_BOT_TOKEN, TELEGRAM_SECRET_PATH } = process.env;

const app = Machinat.createApp({
  modules: [
    Http.initModule({ /* ... */ }),
  ],
  platforms: [
    Telegram.intiModule({
      webhookPath: '/webhook/telegram',
      botToken: TELEGRAM_BOT_TOKEN,
      secretPath: TELEGRAM_SECRET_PATH,
    }),
  ],
});
```
