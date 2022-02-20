---
title: Messenger Platform
sidebar_label: Messenger
---

`@machinat/messenger` platform enable your app to receive/send messages on [Messenger platform](https://developers.facebook.com/docs/messenger-platform/)
as a Facebook page.

## Install

Install the `core`, `http` and `messenger` packages:

```bash
npm install @machinat/core @machinat/http @machinat/messenger
```

## Setup

:::tip
You can check [setup section in the tutorial](https://machinat.com/docs/learn/create-app#platform-setup?p=messenger).
It brings you to set up everything step by step.
:::

First you need to apply a Facebook app to use with.
You can follow the [official guide](https://developers.facebook.com/docs/messenger-platform/getting-started/app-setup)
to create one.

Then set up the `http` and `messenger` modules like this:

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
    Http.initModule({ port: 8080 }),
  ],
  platforms: [
    Messenger.intiModule({
      entryPath: '/webhook/messenger',     // webhook path
      pageId: Number(MESSENGER_PAGE_ID),   // Facebook page id
      appSecret: MESSENGER_APP_SECRET,     // Facebook app secret
      accessToken: MESSENGER_ACCESS_TOKEN, // page access token
      verifyToken: MESSENGER_VERIFY_TOKEN, // token for webhook verification
    }),
  ],
});
```

## Usage

Here's an example to receive events and send replies back:

```tsx
import Machinat from '@machinat/core';
import * as Messenger from '@machinat/messenger/components';
import app from './app';

app.onEvent(async ({ platform, event, reply }) => {
  if (platform === 'messenger' && event.type === 'text') {
    await reply(
      <Messenger.Expression
        notificationType="SILENT_PUSH"
        personaId="BOT_PERSONA_ID"
        quickReplies={
          <Messenger.TextReply title="I want 🐶" payload="doggo" />
        }
      >
        Hello Messenger! 👋
        <Messenger.GenericTemplate>
          <Messenger.GenericItem
            title="You daily 🐱"
            imageUrl="https://cataas.com/cat"
            buttons={
              <Messenger.PostbackButton title="More" payload="catto" />
            }
          />
        </Messenger.GenericTemplate>
      </Messenger.Expression>
    );
  }
});
```

Check the API reference for the details of [events](https://machinat.com/api/modules/messenger#messengerevent)
and [components](https://machinat.com/api/modules/messenger_components).

## Webview

:::warning
There is [a Facebook bug](https://developers.facebook.com/support/bugs/294949372549147)
that breaks the webview on the **Messenger website** client.
You have to test your app with the **mobile app**.
:::

### Auth Setup

To use [webviews](./embedded-webview) in Messenger,
configure the app with these steps:

1. Add the server domain to [`whitelisted_domains`](https://developers.facebook.com/docs/messenger-platform/reference/messenger-profile-api/domain-whitelisting)
  of the page.
2. Add the auth provider to the `webview` platform. Like:

```ts
import Webview from '@machinat/webview';
import MessengerAuth from '@machinat/messenger/webview';

const app = Machinat.createApp({
  platforms: [
    Webview.initModule({
      authPlatforms:[
        MessengerAuth
      ],
      // ...
    }),
  ],
});
```

3. Expose your Facebook app id in `next.config.js`:

```js {5}
module.exports = {
  publicRuntimeConfig: {
    messengerAppId: process.env.MESSENGER_APP_ID,
  },
  // ...
};
```

4. Set up the `WebviewClient` in the webview:

```ts
import getConfig from 'next/config';
import WebviewClient from '@machinat/webview/client';
import MessengerAuth from '@machinat/messenger/webview/client';

const { publicRuntimeConfig } = getConfig();

const client =  new WebviewClient({
  authPlatforms: [
    new MessengerAuth({
      appId: publicRuntimeConfig.messengerAppId,
    }),
  ],
});
```

### Open the Webview

The webview can be opened with an `UrlButton` in the chatroom.
For example:

```tsx
app.onEvent(async ({ reply }) => {
  await reply(
    <Messenger.ButtonTemplate
      buttons={
        <Messenger.UrlButton
          title="Open 📤"
          messengerExtensions
          url="https://your.server.domain/webview?platform=messenger"
        />
      }
    >
      Hello Webview!
    </Messenger.ButtonTemplate>
  );
});
```

Two thing to note here:

1. `messengerExtensions` prop has to be `true`.
2. `url` prop should link to the webview page with `platform=messenger` query.

The users will be logged in with the Messenger account in the webview.
Check the [webview document](https://machinat.com/docs/embedded-webview) to learn more.

## Assets Manager

[`MessengerAssetsManager`](https://machinat.com/api/classes/messenger_asset.messengerassetsmanager.html)
service helps you to manage resources on the Messenger platform,
like attachments and personas.

To use it, you have to install a [state provider](./using-states) first.
Then register `MessengerAssetsManager` like this:

```ts {2,11-13,17}
import { FileState } from '@machinat/dev-tools';
import MessengerAssetsManager from '@machinat/messenger/asssets';

const app = Machinat.createApp({
  modules: [
    FileState.initModule({ path: '.state_data.json' }),
  ],
  platforms: [
    Messenger.initModule({
      // ...
      dispatchMiddlewares: [
        saveReusableAttachments,
      ]
    }),
  ],
  services: [for
    MessengerAssetsManager,
  ],
});
```

Here is an example to upload a reusable attachment:

```tsx
import fs from 'fs';
import { makeContainer } from '@machinat/core';
import * as Messenger from '@machinat/messenger/components';
import MessengerAssetsManager, { saveReusableAttachments } from '@machinat/messenger/asssets';

app.onEvent(makeContainer({ deps: [MessengerAssetsManager] })(
  (assetsManager) =>
    async ({ reply }) => {
      const fooImageId = await assetsManager.getAttachment('foo.image');

      if (fooImageId) {
        await reply(
          <Messenger.Image attachmentId={fooImageId} />
        );
      } else {
        await reply(
          <Messenger.Image
            isReusable
            attachmentAssetTag="foo.image"
            attachmentFileData={fs.createReadStream('./assets/foo.jpg')}
          />
        );
      }
}
));
```

If you upload an attachment with `isReusable` and `attachmentAssetTag` props,
the `saveReusableAttachments` middleware will save the returned id.
You can reuse the saved id for the next time.

## Resources

Here are some resources for further reading:

- [`@machinat/messenger` package reference](https://machinat.com/api/modules/messenger.html)
- [Messenger Platform document](https://developers.facebook.com/docs/messenger-platform)
