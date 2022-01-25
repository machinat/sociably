---
title: Telegram Platform
sidebar_label: Telegram
---

The `@machinat/telegram` platform enable your app to receive/send messages as a
[Telegram bot](https://core.telegram.org/bots).

## Install

Install `core`, `http` and `telegram` package with npm:

```bash
npm install @machinat/core @machinat/http @machinat/telegram
```

Or with yarn:

```bash
yarn add @machinat/core @machinat/http @machinat/telegram
```

## Steup

:::tip
You can check the [setup section of our tutorial](https://machinat.com/docs/learn/create-app#platform-setup?p=telegram).
It brings you to register a Telegram bot and configure your app step by step.
:::

First, you have to configure a Telegram bot for your app to use. You can
follow the steps in [this official guide](https://core.telegram.org/bots#6-botfather)
to create one from [@Botfather](https://t.me/botfather).

Then register the `http` and `telegram` module with the settings like this:

```ts
import Machinat from '@machinat/core';
import Http from '@machinat/http';
import Telegram from '@machinat/telegram';

const { TELEGRAM_BOT_TOKEN, TELEGRAM_SECRET_PATH } = process.env;

const app = Machinat.createApp({
  modules: [
    Http.initModule({ port: 8080 }),
  ],
  platforms: [
    Telegram.intiModule({
      webhookPath: '/webhook/telegram',    // webhook path
      botToken: TELEGRAM_BOT_TOKEN,        // bot token
      secretPath: TELEGRAM_SECRET_PATH,    // secret trailing path of webhook
    }),
  ],
});
```

Finally, you have to register the webhook to subscribe events from Telegram.
You can use these codes to do it:

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

Check the package reference for the details of [event types](https://machinat.com/api/modules/telegram.html#telegramevent)
and [component APIs](https://machinat.com/api/modules/telegram_components.html).

## Webview

To open a webview with [Seamless Telegram Login](https://core.telegram.org/bots/api#loginurl)
in chat, set up with these steps:

1. Send `/setdomain` command to [@Botfather](https://t.me/botfather) to register the server domain of your bot.
2. Set up [`@machinat/webview`](https://github.com/machinat/machinat/tree/master/packages/webview) platform like this:

```ts {13}
import Webview from '@machinat/webview';
import TelegramWebviewAuth from '@machinat/telegram/webview';

const app = Machinat.createApp({
  modules: [
    Http.initModule({ port: 8080 }),
  ],
  platforms: [
    Telegram.initModule({ /* ... */ }),
    Webview.intiModule({
      // ...
      authPlatforms: [
        TelegramWebviewAuth
      ]
    }),
  ],
});
```

3. Expose your bot name to webview in the `next.config.js`:

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
import TelegramWebviewAuth from '@machinat/telegram/webview/client';

const { publicRuntimeConfig } = getConfig();

const client =  new WebviewClient({
  authPlatforms: [
    new TelegramWebviewAuth({
      botName: publicRuntimeConfig.telegramBotName,
    }),
  ],
});
```

5. Open the webview through an `UrlButton` with  the`login` prop set to `true`. The `url` prop should direct to `/auth/telegram` endpoint of your server. Like:

```tsx
app.onEvent(async ({ reply }) => {
  await reply(
    <Telegram.Expression
      replyMarkup={
        <Telegram.InlineKeyboard>
          <Telegram.UrlButton
            text="Open 📤"
            url="https://your.server.domain/auth/telegram"
            login
          />
        </Telegram.InlineKeyboard>
      }
    >
      Hello Webview!
    </Telegram.Expression>
  );
});
```

Now users will be automatically logged in with Telegram account in the webview. Check the [webview document](https://machinat.com/docs/embedded-webview) to learn more about webview.

## Assets Manager

[`TelegramAssetsManager`](https://machinat.com/api/classes/telegram_asset.telegramassetsmanager.html)
service helps you to manage resources at Telegram platform, like uploaded file.
Make sure you have a state storage installed, and register `TelegramAssetsManager` like this:

```ts {2,11-13,17}
import { FileState } from '@machinat/dev-tools';
import TelegramAssetsManager, { saveUplodedFile } from '@machinat/telegram/asssets';

const app = Machinat.createApp({
  modules: [
    FileState.initModule({ path: '.state_file' }),
  ],
  platforms: [
    Telegram.initModule({
      // ...
      dispatchMiddlewares: [
        saveUplodedFile,
      ]
    }),
  ],
  services: [
    TelegramAssetsManager,
  ],
});
```

Here is an example to upload an image for sending and reuse it:

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

Once you send an uploaded file with `fileAssetTag` prop, `saveUplodedFile`
middleware will save the returned file id. The stored id can be reused for
the next time.

## Resources

Here are some resources for further reading:

- [`@machinat/telegram` package reference](https://machinat.com/api/modules/telegram.html)
- [Telegram bot API reference](https://core.telegram.org/bots)
