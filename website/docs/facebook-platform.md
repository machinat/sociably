---
title: Facebook Platform
sidebar_label: Facebook
---

`@sociably/facebook` platform enable your app to receive/send messages on [Facebook Messenger platform](https://developers.facebook.com/docs/messenger-platform/)
as a Facebook page.

## Install

Install the `core`, `http` and `facebook` packages:

```bash
npm install @sociably/core @sociably/http @sociably/facebook
```

## Setup

:::tip
You can check [setup section in the tutorial](https://sociably.js.org/docs/learn/create-app#platform-setup?p=facebook).
It brings you to set up everything step by step.
:::

First you need to apply a Facebook app and set up the page binding.
Follow the [official guide](https://developers.facebook.com/docs/messenger-platform/getting-started/app-setup)
for the setup procedures.

Then set up the `http` and `facebook` modules like this:

```ts
import Sociably from '@sociably/core';
import Http from '@sociably/http';
import Facebook from '@sociably/facebook';

const {
  FACEBOOK_PAGE_ID,
  FACEBOOK_APP_ID,
  FACEBOOK_ACCESS_TOKEN,
  FACEBOOK_APP_SECRET,
  FACEBOOK_VERIFY_TOKEN,
} = process.env;

const app = Sociably.createApp({
  modules: [
    Http.initModule({ port: 8080 }),
  ],
  platforms: [
    Facebook.intiModule({
      entryPath: '/webhook/facebook',     // webhook path
      agentSettings: {
        accessToken: FACEBOOK_ACCESS_TOKEN, // page access token
        verifyToken: FACEBOOK_VERIFY_TOKEN, // token for webhook verification
      },
      pageId: FACEBOOK_PAGE_ID,           // Facebook page id
      appSecret: FACEBOOK_APP_SECRET,     // Facebook app secret
    }),
  ],
});
```

## Usage

Here's an example to receive events and send replies back:

```tsx
import Sociably from '@sociably/core';
import * as Facebook from '@sociably/facebook/components';
import app from './app';

app.onEvent(async ({ platform, event, reply }) => {
  if (platform === 'facebook' && event.type === 'text') {
    await reply(
      <Facebook.Expression
        notificationType="SILENT_PUSH"
        personaId="BOT_PERSONA_ID"
        quickReplies={
          <Facebook.TextReply title="I want 🐶" payload="doggo" />
        }
      >
        Hello Facebook! 👋
        <Facebook.GenericTemplate>
          <Facebook.GenericItem
            title="You daily 🐱"
            imageUrl="https://cataas.com/cat"
            buttons={
              <Facebook.PostbackButton title="More" payload="catto" />
            }
          />
        </Facebook.GenericTemplate>
      </Facebook.Expression>
    );
  }
});
```

Check API references for the details of [events](https://sociably.js.org/api/modules/facebook#facebookevent)
and [components](https://sociably.js.org/api/modules/facebook_components).

## Webview

### Auth Setup

To use [webviews](./embedded-webview) in Facebook Messenger,
configure the app with these steps:

1. Add auth provider to the `webview` platform and set app info at the `basicAuth`.
   And make sure you have a state provider installed.
   Like this:

```ts
import Webview from '@sociably/webview';
import RedisState from '@machiniat/redis';
import FacebookAuth from '@sociably/facebook/webview';

const app = Sociably.createApp({
  platforms: [
    Webview.initModule({
      authPlatforms:[
        FacebookAuth
      ],
      basicAuth: {
        appName: 'My Foo App',
        appIconUrl: './webview/img/logo.png'
      },
      // ...
    }),
  ],
  modules: [
    RedisState.initModule({
      clientOptions: {
        url: REDIS_URL,
      },
    }),
  ],
});
```

2. Set up the `WebviewClient` in the webview:

```ts
import WebviewClient from '@sociably/webview/client';
import FacebookAuth from '@sociably/facebook/webview/client';

const client =  new WebviewClient({
  authPlatforms: [
    new FacebookAuth(),
  ],
});
```

### Open the Webview

The webview can be opened with a `WebviewButton` in the chatroom.
For example:

```tsx
import * as Facebook from '@sociably/facebook/components';
import { WebviewButton as FacebookWebviewButton } from '@sociably/facebook/webview';

app.onEvent(async ({ reply }) => {
  await reply(
    <Facebook.ButtonTemplate
      buttons={
        <FacebookWebviewButton title="Open 📤" />
      }
    >
      Hello Webview!
    </Facebook.ButtonTemplate>
  );
});
```

The user will be asked to enter a login code sent in the chat.
After login, webview can communicate to the server as the authenticated user.

Check the [webview platform document](https://sociably.js.org/docs/embedded-webview)
to learn more.

## Assets Manager

[`FacebookAssetsManager`](https://sociably.js.org/api/classes/facebook_asset.facebookassetsmanager.html)
service helps you to manage resources on the Facebook platform,
like attachments and personas.

To use it, you have to install a [state provider](./using-states) first.
Then register `FacebookAssetsManager` like this:

```ts
import RedisState from '@machiniat/redis';
// highlight-next-line
import FacebookAssetsManager, { saveReusableAttachments } from '@sociably/facebook/asssets';

const app = Sociably.createApp({
  services: [
    // highlight-next-line
    FacebookAssetsManager,
  ],
  platforms: [
    Facebook.initModule({
      // ...
      dispatchMiddlewares: [
        // highlight-next-line
        saveReusableAttachments,
      ]
    }),
  ],
  modules: [
    RedisState.initModule({
      clientOptions: { url: REDIS_URL },
    }),
  ],
});
```

Here is an example to upload a reusable attachment:

```tsx
import fs from 'fs';
import { serviceContainer } from '@sociably/core';
import * as Facebook from '@sociably/facebook/components';
import FacebookAssetsManager from '@sociably/facebook/asssets';

app.onEvent(serviceContainer({ deps: [FacebookAssetsManager] })(
  (assetsManager) =>
    async ({ reply }) => {
      const fooImageId = await assetsManager.getAttachment('foo.image');

      if (fooImageId) {
        await reply(
          <Facebook.Image attachmentId={fooImageId} />
        );
      } else {
        await reply(
          <Facebook.Image
            reusable
            assetTag="foo.image"
            fileData={fs.createReadStream('./assets/foo.jpg')}
          />
        );
      }
}
));
```

If you upload an attachment with `reusable` and `assetTag` props,
the `saveReusableAttachments` middleware will save the returned attachment id.
You can reuse the saved id for the next time.

## Resources

Here are some resources for further reading:

- [`@sociably/facebook` package reference](https://sociably.js.org/api/modules/facebook.html)
- [Messenger Platform document](https://developers.facebook.com/docs/messenger-platform)
