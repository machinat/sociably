---
title: Instagram Platform
sidebar_label: Instagram
---

`@sociably/instagram-platform` enables your app to receive events and send
messages through the [Instagram Messaging API](https://developers.facebook.com/docs/messenger-platform/instagram)
on behalf of an Instagram account.

## Install

Install the `core`, `http` and `instagram-platform` packages:

```bash
npm install @sociably/core @sociably/http @sociably/instagram-platform
```

## Setup

:::tip
You can check the [setup section in the tutorial](https://sociably.js.org/docs/learn/create-app#platform-setup?p=instagram).
It walks through the full Meta and Instagram configuration.
:::

First create a Meta app, enable Messenger for Instagram, connect the Instagram
account to a Facebook page, and generate an access token.
Follow the [official guide](https://developers.facebook.com/docs/messenger-platform/getting-started/app-setup)
for the setup procedures.

Then set up the `http` and `instagram-platform` modules like this:

```ts
import Sociably from '@sociably/core';
import Http from '@sociably/http';
import Instagram from '@sociably/instagram-platform';

const {
  META_APP_ID,
  META_APP_SECRET,
  META_WEBHOOK_VERIFY_TOKEN,
  INSTAGRAM_AGENT_ID,
  INSTAGRAM_PAGE_ID,
  INSTAGRAM_ACCESS_TOKEN,
  INSTAGRAM_AGENT_USERNAME,
} = process.env;

const app = Sociably.createApp({
  modules: [Http.initModule({ port: 8080 })],
  platforms: [
    Instagram.initModule({
      webhookPath: 'webhook/instagram',
      appId: META_APP_ID,
      appSecret: META_APP_SECRET,
      webhookVerifyToken: META_WEBHOOK_VERIFY_TOKEN,
      agentSettings: {
        accountId: INSTAGRAM_AGENT_ID,
        pageId: INSTAGRAM_PAGE_ID,
        accessToken: INSTAGRAM_ACCESS_TOKEN,
        username: INSTAGRAM_AGENT_USERNAME,
      },
    }),
  ],
});
```

## Usage

Here is an example that receives text messages and replies with quick replies
and a generic template:

```tsx
import Sociably from '@sociably/core';
import * as Instagram from '@sociably/instagram-platform/components';
import app from './app';

app.onEvent(async ({ platform, event, reply }) => {
  if (platform === 'instagram' && event.type === 'text') {
    await reply(
      <Instagram.Expression
        quickReplies={
          <Instagram.TextReply title="I want 🐶" payload="doggo" />
        }
      >
        <i>Hello Instagram! 👋</i>
        <Instagram.GenericTemplate>
          <Instagram.GenericItem
            title="Your daily 🐱"
            imageUrl="https://cataas.com/cat"
            buttons={
              <Instagram.PostbackButton title="More" payload="catto" />
            }
          />
        </Instagram.GenericTemplate>
      </Instagram.Expression>,
    );
  }
});
```

Check API references for the details of
[events](https://sociably.js.org/api/modules/instagram.html#instagramevent) and
[components](https://sociably.js.org/api/modules/instagram_components.html).

## Webview

### Auth Setup

To use [webviews](./embedded-webview) in Instagram, configure the app with these
steps:

1. Add the Instagram auth provider to the `webview` platform, and make sure you
   have a state provider installed.
2. Set up the `WebviewClient` in the webview app.

```ts
import Webview from '@sociably/webview';
import RedisState from '@machinat/redis';
import InstagramAuth from '@sociably/instagram-platform/webview';

const app = Sociably.createApp({
  platforms: [
    Webview.initModule({
      authPlatforms: [InstagramAuth],
      basicAuth: {
        appName: 'My Foo App',
        appIconUrl: './webview/img/logo.png',
      },
    }),
  ],
  modules: [
    RedisState.initModule({
      clientOptions: { url: REDIS_URL },
    }),
  ],
});
```

```ts
import WebviewClient from '@sociably/webview/client';
import InstagramAuth from '@sociably/instagram-platform/webview/client';

const client = new WebviewClient({
  authPlatforms: [new InstagramAuth()],
});
```

### Open the Webview

The webview can be opened with `WebviewButton`, which renders an Instagram URL
button with the authenticated webview URL.

```tsx
import * as Instagram from '@sociably/instagram-platform/components';
import { WebviewButton as InstagramWebviewButton } from '@sociably/instagram-platform/webview';

app.onEvent(async ({ reply }) => {
  await reply(
    <Instagram.GenericTemplate>
      <Instagram.GenericItem
        title="Hello Webview!"
        buttons={<InstagramWebviewButton title="Open 📤" />}
      />
    </Instagram.GenericTemplate>,
  );
});
```

The user will be asked to enter the login code sent in chat, and the webview
can then communicate with the server as the authenticated Instagram user.

Check the [webview platform document](https://sociably.js.org/docs/embedded-webview)
to learn more.

## Assets Manager

`InstagramAssetsManager` is provided by the platform module. It helps you manage
Instagram Messenger profile settings and reusable attachments for an Instagram
account.

For example, you can use it in a migration or setup script to subscribe the app
and configure ice breakers:

```ts
import { serviceContainer } from '@sociably/core';
import Instagram from '@sociably/instagram-platform';

const { INSTAGRAM_AGENT_ID } = process.env;

export const up = serviceContainer({
  deps: [Instagram.AssetsManager],
})(async (instagramManager) => {
  await instagramManager.setAppSubscription();
  await instagramManager.setSubscribedApp(INSTAGRAM_AGENT_ID);
  await instagramManager.setMessengerProfile(INSTAGRAM_AGENT_ID, {
    iceBreakers: [
      {
        locale: 'default',
        callToActions: [
          {
            question: 'Hello!',
            payload: JSON.stringify({ action: 'greeting' }),
          },
        ],
      },
    ],
  });
});
```

It can also reuse uploaded attachments by tag:

```tsx
import { serviceContainer } from '@sociably/core';
import * as Instagram from '@sociably/instagram-platform/components';
import InstagramAssetsManager from '@sociably/instagram-platform/asset';

const AGENT_ID = process.env.INSTAGRAM_AGENT_ID as string;

app.onEvent(
  serviceContainer({ deps: [InstagramAssetsManager] })(
    (assetsManager) =>
      async ({ reply }) => {
        const fooImageId = await assetsManager.getAttachment(AGENT_ID, 'foo.image');

        if (fooImageId) {
          await reply(<Instagram.Image attachmentId={fooImageId} />);
        } else {
          await reply(
            <Instagram.Image
              reusable
              assetTag="foo.image"
              url="https://image.from.web/url.jpg"
            />,
          );
        }
      },
  ),
);
```

Reusable attachments with `assetTag` are stored automatically by the platform's
dispatch middleware, so you can fetch them later with
`InstagramAssetsManager.getAttachment()`.

## Resources

Here are some resources for further reading:

- [`@sociably/instagram-platform` package reference](https://sociably.js.org/api/modules/instagram.html)
- [Instagram Messaging API document](https://developers.facebook.com/docs/messenger-platform/instagram)
