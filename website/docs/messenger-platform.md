---
title: Messenger Platform
sidebar_label: Messenger
---

The `@machinat/messenger` platform enable your app to receive/send messages as a
Facebook page on [Messenger platform](https://developers.facebook.com/docs/messenger-platform/).

## Install

Install `core`, `http` and `messenger` package with npm:

```bash
npm install @machinat/core @machinat/http @machinat/messenger
```

Or with yarn:

```bash
yarn add @machinat/core @machinat/http @machinat/messenger
```

## Setup

:::tip
You can check the [setup section of our tutorial](https://machinat.com/docs/learn/create-app#platform-setup?p=messenger).
It brings you to create a Facebook app and configure your app step by step.
:::

First you have to configure a Facebook app to use. You can follow the steps in
[this official guide](https://developers.facebook.com/docs/messenger-platform/getting-started/app-setup)
to do it.

Then register the `http` and `messenger` module with the settings like this:

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
      entryPath: '/webhook/messenger',         // webhook path
      pageId: Number(MESSENGER_PAGE_ID),       // Facebook page id
      appSecret: MESSENGER_APP_SECRET,         // Facebook app secret
      accessToken: MESSENGER_ACCESS_TOKEN,     // page access token
      verifyToken: MESSENGER_VERIFY_TOKEN,     // token for webhook verification
    }),
  ],
});
```

## Usage

Here is an example to receive events and send replies back:

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

Check the package reference for the details of [event types](https://machinat.com/api/modules/messenger.html#messengerevent)
and [component APIs](https://machinat.com/api/modules/messenger_components.html).

## Webview

To enable [Messenger webview](https://developers.facebook.com/docs/messenger-platform/webview), set up with these steps:

1. Add server domain to [`whitelisted_domains`](https://developers.facebook.com/docs/messenger-platform/reference/messenger-profile-api/domain-whitelisting)
   of the page profile.
2. Set up [`@machinat/webview`](https://github.com/machinat/machinat/tree/master/packages/webview) platform like this:

```ts {1-2,6,18}
import Webview from '@machinat/webview';
import MessengerWebviewAuth from '@machinat/messenger/webview';

const {
  //...
  MESSENGER_APP_ID,
} = process.env;

const app = Machinat.createApp({
  modules: [
    Http.initModule({ port: 8080 }),
  ],
  platforms: [
    Messenger.initModule({ /* ... */ }),
    Webview.initModule({
      // ...
      authPlatforms:[
        MessengerWebviewAuth
      ],
    }),
  ],
});
```

3. Expose your Facebook app id to webview in the `next.config.js`:

```js {5}
module.exports = {
  distDir: '../dist',
  basePath: '/webview',
  publicRuntimeConfig: {
    messengerAppId: process.env.MESSENGER_APP_ID,
  },
};
```

4. Set up the `WebviewClient` in the webview:

```ts
import getConfig from 'next/config';
import WebviewClient from '@machinat/webview/client';
import MessengerWebviewAuth from '@machinat/messenger/webview/client';

const { publicRuntimeConfig } = getConfig();

const client =  new WebviewClient({
  authPlatforms: [
    new MessengerWebviewAuth({
      appId: publicRuntimeConfig.messengerAppId,
    }),
  ],
});
```

5. Open the webview through an `UrlButton` with the `messengerExtensions` prop
set to `true`. Like:

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

Now users will be automatically logged in with Messenger account in the webview. Check the [webview document](https://machinat.com/docs/embedded-webview) to learn more about webview.

## Assets Manager

[`MessengerAssetsManager`](https://machinat.com/api/classes/messenger_asset.messengerassetsmanager.html)
service helps you to manage resources at Messenger platform, like attachment and
persona. Make sure you have a state storage installed, and register `MessengerAssetsManager`
like this:

```ts {2,11-13,17}
import { FileState } from '@machinat/dev-tools';
import MessengerAssetsManager from '@machinat/messenger/asssets';

const app = Machinat.createApp({
  modules: [
    FileState.initModule({ path: '.state_file' }),
  ],
  platforms: [
    Messenger.initModule({
      // ...
      dispatchMiddlewares: [
        saveReusableAttachments,
      ]
    }),
  ],
  services: [
    MessengerAssetsManager,
  ],
});
```

Here is an example to upload a reusable attachment and reuse it:

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

Once you send an uploaded attachment with `isReusable` and `attachmentAssetTag` props,
the `saveReusableAttachments` middleware will save the returned id. The saved
id can then be reused for sending next time.

## Resources

Here are some resources for further reading:

- [`@machinat/messenger` package reference](https://machinat.com/api/modules/messenger.html)
- [Messenger Platform document](https://developers.facebook.com/docs/messenger-platform)
