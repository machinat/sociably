---
title: Telegram Platform
sidebar_label: Telegram
---

The `@machinat/telegram` platform enable your app to receive/send messages as a
[Telegram bot](https://core.telegram.org/bots).

## Install

Install the `core`, `http` and `telegram` packages:

```bash
npm install @machinat/core @machinat/http @machinat/telegram
```

## Steup

:::tip
:::tip
You can check [setup section in the tutorial](https://machinat.com/docs/learn/create-app#platform-setup?p=telegram).
It brings you to set up everything step by step.
:::

First, you need a Telegram bot to use with.
You can [the official guide](https://core.telegram.org/bots#6-botfather)
to create one from [@Botfather](https://t.me/botfather).

Then set up the `http` and `telegram` module like this:

```ts
import Machinat from '@machinat/core';
import Http from '@machinat/http';
import Telegram from '@machinat/telegram';

const {
  TELEGRAM_BOT_NAME,
  TELEGRAM_BOT_TOKEN,
  TELEGRAM_SECRET_PATH,
} = process.env;

const app = Machinat.createApp({
  modules: [
    Http.initModule({ port: 8080 }),
  ],
  platforms: [
    Telegram.intiModule({
      webhookPath: '/webhook/telegram', // webhook path
      botName: TELEGRAM_BOT_NAME,       // bot name
      botToken: TELEGRAM_BOT_TOKEN,     // bot token
      secretPath: TELEGRAM_SECRET_PATH, // secret path for webhook
    }),
  ],
});
```

Finally, you have to register the webhook to subscribe to events from Telegram.
You can use these codes to do that:

```ts
import { TelegramBot } from '@machinat/telegram';
const { DOMAIN, TELEGRAM_BOT_TOKEN, TELEGRAM_SECRET_PATH } = process.env;

const bot = new TelegramBot({ token: TELEGRAM_BOT_TOKEN });
bot
  .start()
  .then(() =>
    bot.makeApiCall('setWebhook', {
      // webhook url with trailing secretPath
      url: `https://${DOMAIN}/webhook/telegram/${TELEGRAM_SECRET_PATH}`,
    })
  );
```

## Usage

Here is an example to receive events and send replies back:

```tsx
import Machinat from '@machinat/core';
import * as Telegram from '@machinat/telegram/components';
import app from './app';

app.onEvent(async ({ platform, event, reply }) => {
  if (platform === 'telegram' && event.type === 'text') {
    await reply(
      <Telegram.Expression
        disableNotification
        replyMarkup={
          <Telegram.ReplyKeyboard resizeKeyboard oneTimeKeyboard>
            <Telegram.TextReply title="More 🐱" payload="catto" />
            <Telegram.TextReply text="I want 🐶" data="doggo" />
          </Telegram.ReplyKeyboard>
        }
      >
        <p>Hello Telegram! 👋</p>
        <p>It's your daily 🐱</p>
        <img src="https://cataas.com/cat" />
      </Telegram.Expression>
    );
  }
});
```

Check the API reference for the details of [events](https://machinat.com/api/modules/telegram.html#telegramevent)
and [components](https://machinat.com/api/modules/telegram_components.html).

## Webview

### Auth Setup

To use [webviews](./embedded-webview) in Telegram,
configure the app with these steps:

1. Send `/setdomain` command to [@Botfather](https://t.me/botfather) to register the domain of your bot.
2. Add the auth provider to the `webview` platform. Like:

```ts
import Webview from '@machinat/webview';
import TelegramAuth from '@machinat/telegram/webview';

const app = Machinat.createApp({
  platforms: [
    Webview.intiModule({
      authPlatforms: [
        TelegramAuth
      ],
      // ...
    }),
  ],
});
```

3. Expose your bot name in `next.config.js`:

```js {5}
module.exports = {
  distDir: '../dist',
  basePath: '/webview',
  publicRuntimeConfig: {
    telegramBotName: process.env.TELEGRAM_BOT_NAME,
  },
};
```

4. Set up the `WebviewClient` in the webview:

```ts
import getConfig from 'next/config';
import WebviewClient from '@machinat/webview/client';
import TelegramAuth from '@machinat/telegram/webview/client';

const { publicRuntimeConfig } = getConfig();

const client =  new WebviewClient({
  authPlatforms: [
    new TelegramAuth({
      botName: publicRuntimeConfig.telegramBotName,
    }),
  ],
});
```

### Open the Webview

The webview can be opened by a `WebviewButton` in the chatroom.
Like:

```tsx
import * as Telegram from '@machinat/telegram/components';
import { WebviewButton as TelegramWebviewButton } from '@machinat/telegram/webview';

app.onEvent(async ({ reply }) => {
  await reply(
    <Telegram.Expression
      replyMarkup={
        <Telegram.InlineKeyboard>
          <TelegramWebviewButton text="Open 📤" />
        </Telegram.InlineKeyboard>
      }
    >
      Hello Webview!
    </Telegram.Expression>
  );
});
```

The users will be logged in with Telegram account in the webview.
Check the [webview document](https://machinat.com/docs/embedded-webview) to learn more.

## Assets Manager

[`TelegramAssetsManager`](https://machinat.com/api/classes/telegram_asset.telegramassetsmanager.html)
service helps you to manage resources on Telegram platform,
like files.

To use it, you have to install a [state provider](./using-states) first.
Then register `TelegramAssetsManager` like this:

```ts {2,11-13,17}
import { FileState } from '@machinat/dev-tools';
import TelegramAssetsManager, { saveUplodedFile } from '@machinat/telegram/asssets';

const app = Machinat.createApp({
  modules: [
    FileState.initModule({ path: '.state_data.json' }),
  ],
  platforms: [
    Telegram.initModule({
      dispatchMiddlewares: [
        saveUplodedFile,
      ],
      // ...
    }),
  ],
  services: [
    TelegramAssetsManager,
  ],
});
```

Here's an example to upload an image message and reuse it:

```tsx
import fs from 'fs';
import { makeContainer } from '@machinat/core';
import * as Telegram from '@machinat/telegram/components';
import TelegramAssetsManager from '@machinat/telegram/asssets';

app.onEvent(makeContainer({ deps: [TelegramAssetsManager] })(
  (assetsManager) =>
    async ({ reply }) => {
      const fooImageId = await assetsManager.getFile('foo.image');

      if (fooImageId) {
        await reply(
          <Telegram.Image fileId={fooImageId} />
        );
      } else {
        await reply(
          <Telegram.Image
            fileAssetTag="foo.image"
            fileData={fs.createReadStream('./assets/foo.jpg')}
          />
        );
      }
    }
));
```

If you upload a file with `fileAssetTag` prop,
`saveUplodedFile` middleware will save the returned file id.
You can reuse the stored id for the next time.

## Resources

Here are some resources for further reading:

- [`@machinat/telegram` package reference](https://machinat.com/api/modules/telegram.html)
- [Telegram bot API reference](https://core.telegram.org/bots)
