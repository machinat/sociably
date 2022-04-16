---
title: Twitter Platform
sidebar_label: Twitter
---

`@machinat/twitter` platform enable your app to tweet, likes and send/receive direct messages on [Twitter platform](https://developers.facebook.com/docs/twitter-platform/).

## Install

Install the `core`, `http` and `twitter` packages:

```bash
npm install @machinat/core @machinat/http @machinat/twitter
```

## Setup

First you need to apply a Twitter app and set up Account Activity API.
You can follow the first 2 sections in this [official guide](https://developer.twitter.com/en/docs/twitter-api/premium/account-activity-api/guides/getting-started-with-webhooks)
for setup procedures.

Then set up the `http` and `twitter` modules like this:

```ts
import Machinat from '@machinat/core';
import Http from '@machinat/http';
import Twitter from '@machinat/twitter';

const {
  TWITTER_APP_ID,
  TWITTER_APP_KEY,
  TWITTER_APP_SECRET,
  TWITTER_BEARER_TOKEN,
  TWITTER_ACCESS_TOKEN,
  TWITTER_ACCESS_SECRET,
} = process.env;

const app = Machinat.createApp({
  modules: [
    Http.initModule({ port: 8080 }),
  ],
  platforms: [
    Twitter.intiModule({
      webhookPath: '/webhook/twitter',
      appId: TWITTER_APP_ID,               // id of Twitter app
      appKey: TWITTER_APP_KEY,             // key of Twitter app
      appSecret: TWITTER_APP_SECRET,       // secret of Twitter app
      bearerToken: TWITTER_BEARER_TOKEN,   // bearer token of Twitter app
      accessToken: TWITTER_ACCESS_TOKEN,   // access token of agent user
      accessSecret: TWITTER_ACCESS_SECRET, // token secret of agent user
    }),
  ],
});
```

## Usage

Here's an example to receive messages and send replies through direct messages.

```tsx
import Machinat from '@machinat/core';
import * as Twitter from '@machinat/twitter/components';
import app from './app';

app.onEvent(async ({ platform, event, reply }) => {
  if (platform === 'twitter' && event.type === 'text') {
    await reply(
      <Twitter.Expression
        quickReplies={
          <Twitter.QuickReply label="More" payload="catto" />
          <Twitter.QuickReply label="I want 🐶" metadata="doggo" />
        }
      >
        <p>Hello Twitter! 👋</p>
        <Twitter.Photo url="https://cataas.com/cat" />
        <p>You daily 🐱</p>
      </Twitter.Expression>
    );
  }
});
```

Check API references for the details of [events](https://machinat.com/api/modules/twitter#twitterevent)
and [components](https://machinat.com/api/modules/twitter_components).

## Webview

### Auth Setup

To use [webviews](./embedded-webview) in Twitter,
configure the app with these steps:

1. Add auth provider to the `webview` platform and set app info at the `basicAuth`.
   And make sure you have a state provider installed.
   Like this:

```ts
import Webview from '@machinat/webview';
import RedisState from '@machiniat/redis';
import TwitterAuth from '@machinat/twitter/webview';

const app = Machinat.createApp({
  platforms: [
    Webview.initModule({
      authPlatforms:[
        TwitterAuth
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
      clientOptions: { url: REDIS_URL },
    }),
  ],
});
```

2. Expose your Twitter agent user id in `next.config.js`:

```js
// highlight-next-line
const { TWITTER_ACCESS_TOKEN } = process.env;

module.exports = {
  publicRuntimeConfig: {
    // highlight-next-line
    TWITTER_AGENT_ID: TWITTER_ACCESS_TOKEN.split('-', 1)[0],
  },
  // ...
};
```

3. Set up the `WebviewClient` in the webview:

```ts
import getConfig from 'next/config';
import WebviewClient from '@machinat/webview/client';
import TwitterAuth from '@machinat/twitter/webview/client';

const {
  publicRuntimeConfig: { TWITTER_AGENT_ID },
} = getConfig();

const client =  new WebviewClient({
  authPlatforms: [
    new TwitterAuth({ agentId: TWITTER_AGENT_ID }),
  ],
});
```

### Open the Webview

The webview can be opened with a `WebviewButton` in the chatroom.
For example:

```tsx
import * as Twitter from '@machinat/twitter/components';
import { WebviewButton as TwitterWebviewButton } from '@machinat/twitter/webview';

app.onEvent(async ({ reply }) => {
  await reply(
    <Twitter.DirectMessage
      buttons={
        <TwitterWebviewButton label="Open 📤" />
      }
    >
      Hello Webview!
    </Twitter.DirectMessage>
  );
});
```

The user will be asked to enter a login code sent in the chat.
After login, webview can communicate to the server as the authenticated user.

Check the [webview platform document](https://machinat.com/docs/embedded-webview)
to learn more.

## Assets Manager

[`TwitterAssetsManager`](https://machinat.com/api/classes/twitter_asset.twitterassetsmanager.html)
service helps you to manage resources on the Twitter platform,
like media, webhook, custom profile and welcome message.

To use it, you have to install a [state provider](./using-states) first.
Then register `TwitterAssetsManager` like this:

```ts
import RedisState from '@machiniat/redis';
// highlight-next-line
import TwitterAssetsManager, { saveUploadedMedia } from '@machinat/twitter/asssets';

const app = Machinat.createApp({
  services: [
    // highlight-next-line
    TwitterAssetsManager,
  ],
  platforms: [
    Twitter.initModule({
      dispatchMiddlewares: [
        // highlight-next-line
        saveUploadedMedia,
      ]
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

Here's an example to upload a reusable media from an external URL:

```tsx
import fs from 'fs';
import { makeContainer } from '@machinat/core';
import * as Twitter from '@machinat/twitter/components';
import TwitterAssetsManager from '@machinat/twitter/asssets';

app.onEvent(makeContainer({ deps: [TwitterAssetsManager] })(
  (assetsManager) =>
    async ({ reply }) => {
      const fooImageId = await assetsManager.getMedia('foo.image');

      if (fooImageId) {
        await reply(
          <Twitter.Photo mediaId={fooImageId} />
        );
      } else {
        await reply(
          <Twitter.Photo
            shared
            url="https://image.from.web/url.jpg"
          />
        );
      }
}
));
```

If you upload a media with `shared` and `assetTag` props,
the `saveUploadedMedia` middleware will save the returned media id.
You can reuse the saved id for the next time.

## Resources

Here are some resources for further reading:

- [`@machinat/twitter` package reference](https://machinat.com/api/modules/twitter.html)
- [Twitter Platform document](https://developers.facebook.com/docs/twitter-platform)
