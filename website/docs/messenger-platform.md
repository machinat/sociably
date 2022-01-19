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

To enable [Messenger webview](https://developers.facebook.com/docs/messenger-platform/webview),
add [`@machinat/webview`](https://github.com/machinat/machinat/tree/master/packages/webview)
platform and set up with these steps:

1. Add server domain to [`whitelisted_domains`](https://developers.facebook.com/docs/messenger-platform/reference/messenger-profile-api/domain-whitelisting)
   of the page profile.
2. Add `MessengerAuthenticator` into the `Webview.AuthenticatorList`.
3. Expose Facebook app id to front-end.

```ts {1-2,7,22-24,30}
import Webview from '@machinat/webview';
import MessengerAuthenticator from '@machinat/messenger/webview';
// ...

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
    Webview.intiModule({
      // ...
      nextServerOptions: {
        // ...
        conf: {
          ...nextConfigs,
          publicRuntimeConfig: {
            messengerAppId: MESSENGER_APP_ID,
          }
        }
      }
    }),
  ],
  services: [
    { provide: Webview.AuthenticatorList, withProvider: MessengerAuthenticator },
  ],
});
```

The webview can be opened by an `UrlButton` with the `messengerExtensions` prop
set to `true`. Like this:

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

Then add `MessengerClientAuthenticator` in the webview client:

```ts
import getConfig from 'next/config';
import WebviewClient from '@machinat/webview/client';
import { MessengerClientAuthenticator } from '@machinat/messenger/webview';

const { publicRuntimeConfig } = getConfig();

const client =  new WebviewClient({
  authenticators: [
    new MessengerClientAuthenticator({
      appId: publicRuntimeConfig.messengerAppId,
    }),
  ],
});
```

The client can communicate to server with the Messenger user and chat info. To
learn more about the webview platform usage, check the [document](https://machinat.com/docs/embedded-webview).

## Assets Manager

[`MessengerAssetsManager`](https://machinat.com/api/classes/messenger_asset.messengerassetsmanager.html)
service helps you to manage resources at Messenger platform, like attachment and
persona. Make sure you have a state storage installed, and register the service
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
import { makeContainer } from '@machinat/core/service';
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
the `saveReusableAttachments` middleware will save the returned id. The saved
id can then be reused for sending next time.

## Resources

Here are some resources for further reading:

- [`@machinat/messenger` package reference](https://machinat.com/api/modules/messenger.html)
- [Messenger Platform document](https://developers.facebook.com/docs/messenger-platform)
