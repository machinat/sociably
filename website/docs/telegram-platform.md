---
title: Telegram Platform
sidebar_label: Telegram
---

The `@sociably/telegram` platform enable your app to receive/send messages as a
[Telegram bot](https://core.telegram.org/bots).

## Install

Install the `core`, `http` and `telegram` packages:

```bash
npm install @sociably/core @sociably/http @sociably/telegram
```

## Steup

:::tip
:::tip
You can check [setup section in the tutorial](https://sociably.js.org/docs/learn/create-app#platform-setup?p=telegram).
It brings you to set up everything step by step.
:::

First, you need to apply a Telegram bot from [@Botfather](https://t.me/botfather).
Follow [the official guide](https://core.telegram.org/bots#6-botfather)
for the setup procedures.

Then set up the `http` and `telegram` module like this:

```ts
import Sociably from '@sociably/core';
import Http from '@sociably/http';
import Telegram from '@sociably/telegram';

const {
  TELEGRAM_BOT_NAME,
  TELEGRAM_BOT_TOKEN,
  TELEGRAM_TOKEN_SECRET,
} = process.env;

const app = Sociably.createApp({
  modules: [
    Http.initModule({ port: 8080 }),
  ],
  platforms: [
    Telegram.intiModule({
      webhookPath: '/webhook/telegram', // webhook path
      botSettings: {
        botName: TELEGRAM_BOT_NAME,       // bot name
        botToken: TELEGRAM_BOT_TOKEN,     // bot token
        tokenSecret: TELEGRAM_TOKEN_SECRET, // secret path for webhook
      },
    }),
  ],
});
```

Finally, you have to register the webhook to subscribe to events from Telegram.
You can use these codes to do that:

```ts
import { TelegramBot } from '@sociably/telegram';
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
import Sociably from '@sociably/core';
import * as Telegram from '@sociably/telegram/components';
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

Check the API reference for the details of [events](https://sociably.js.org/api/modules/telegram.html#telegramevent)
and [components](https://sociably.js.org/api/modules/telegram_components.html).

## Webview

### Auth Setup

To use [webviews](./embedded-webview) in Telegram,
configure the app with these steps:

1. Send `/setdomain` command to [@Botfather](https://t.me/botfather) to register the domain of your bot.
2. Add the auth provider to the `webview` platform. Like:

```ts
import Webview from '@sociably/webview';
import TelegramAuth from '@sociably/telegram/webview';

const app = Sociably.createApp({
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

3. Set up the `WebviewClient` in the webview:

```ts
import WebviewClient from '@sociably/webview/client';
import TelegramAuth from '@sociably/telegram/webview/client';

const client =  new WebviewClient({
  authPlatforms: [
    new TelegramAuth(),
  ],
});
```

### Open the Webview

The webview can be opened by a `WebviewButton` in the chatroom.
Like:

```tsx
import * as Telegram from '@sociably/telegram/components';
import { WebviewButton as TelegramWebviewButton } from '@sociably/telegram/webview';

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
Check the [webview document](https://sociably.js.org/docs/embedded-webview) to learn more.

## Assets Manager

[`TelegramAssetsManager`](https://sociably.js.org/api/classes/telegram_asset.telegramassetsmanager.html)
service helps you to manage resources on Telegram platform,
like files.

To use it, you have to install a [state provider](./using-states) first.
Then register `TelegramAssetsManager` like this:

```ts
import { FileState } from '@sociably/dev-tools';
// highlight-next-line
import TelegramAssetsManager, { saveUplodedFile } from '@sociably/telegram/asssets';

const app = Sociably.createApp({
  services: [
    // highlight-next-line
    TelegramAssetsManager,
  ],
  platforms: [
    Telegram.initModule({
      dispatchMiddlewares: [
        // highlight-next-line
        saveUplodedFile,
      ],
      // ...
    }),
  ],
  modules: [
    RedisState.initModule({
      clientOptions: { url: REDIS_URL },
    }),
  ],
});
```

Here's an example to upload an image message and reuse it:

```tsx
import fs from 'fs';
import { makeContainer } from '@sociably/core';
import * as Telegram from '@sociably/telegram/components';
import TelegramAssetsManager from '@sociably/telegram/asssets';

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
            assetTag="foo.image"
            fileData={fs.createReadStream('./assets/foo.jpg')}
          />
        );
      }
    }
));
```

If you upload a file with `assetTag` prop,
`saveUplodedFile` middleware will save the returned file id.
You can reuse the stored id for the next time.

## Resources

Here are some resources for further reading:

- [`@sociably/telegram` package reference](https://sociably.js.org/api/modules/telegram.html)
- [Telegram bot API reference](https://core.telegram.org/bots)
