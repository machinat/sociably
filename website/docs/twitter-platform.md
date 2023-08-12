---
title: Twitter Platform
sidebar_label: Twitter
---

`@sociably/twitter` platform enable your app to tweet, likes and send/receive direct messages on [Twitter platform](https://developers.facebook.com/docs/twitter-platform/).

## Install

Install the `core`, `http` and `twitter` packages:

```bash
npm install @sociably/core @sociably/http @sociably/twitter
```

## Setup

First you need to apply a Twitter app and set up Account Activity API.
You can follow the first 2 sections in this [official guide](https://developer.twitter.com/en/docs/twitter-api/premium/account-activity-api/guides/getting-started-with-webhooks)
for setup procedures.

Then set up the `http` and `twitter` modules like this:

```ts
import Sociably from '@sociably/core';
import Http from '@sociably/http';
import Twitter from '@sociably/twitter';

const {
  TWITTER_AGENT_ID,
  TWITTER_APP_KEY,
  TWITTER_APP_SECRET,
  TWITTER_BEARER_TOKEN,
  TWITTER_ACCESS_TOKEN,
  TWITTER_TOKEN_SECRET,
} = process.env;

const app = Sociably.createApp({
  modules: [
    Http.initModule({ port: 8080 }),
  ],
  platforms: [
    Twitter.intiModule({
      webhookPath: 'webhook/twitter',
      agentSettings: {
        userId: TWITTER_AGENT_ID,            // id of agent user
        accessToken: TWITTER_ACCESS_TOKEN,   // access token of agent user
        tokenSecret: TWITTER_TOKEN_SECRET, // token secret of agent user
      },
      appKey: TWITTER_APP_KEY,             // key of Twitter app
      appSecret: TWITTER_APP_SECRET,       // secret of Twitter app
      bearerToken: TWITTER_BEARER_TOKEN,   // bearer token of Twitter app
    }),
  ],
});
```

## Usage

Here's an example to receive messages and send replies through direct messages.

```tsx
import Sociably from '@sociably/core';
import * as Twitter from '@sociably/twitter/components';
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

Check API references for the details of [events](https://sociably.js.org/api/modules/twitter#twitterevent)
and [components](https://sociably.js.org/api/modules/twitter_components).

## Webview

### Auth Setup

To use [webviews](./embedded-webview) in Twitter,
configure the app with these steps:

1. Add auth provider to the `webview` platform and set app info at the `basicAuth`.
   And make sure you have a state provider installed.
   Like this:

```ts
import Webview from '@sociably/webview';
import RedisState from '@machiniat/redis';
import TwitterAuth from '@sociably/twitter/webview';

const app = Sociably.createApp({
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

2. Set up the `WebviewClient` in the webview:

```ts
import WebviewClient from '@sociably/webview/client';
import TwitterAuth from '@sociably/twitter/webview/client';

const client =  new WebviewClient({
  authPlatforms: [
    new TwitterAuth(),
  ],
});
```

### Open the Webview

The webview can be opened with a `WebviewButton` in the chatroom.
For example:

```tsx
import * as Twitter from '@sociably/twitter/components';
import { WebviewButton as TwitterWebviewButton } from '@sociably/twitter/webview';

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

Check the [webview platform document](https://sociably.js.org/docs/embedded-webview)
to learn more.

## Assets Manager

[`TwitterAssetsManager`](https://sociably.js.org/api/classes/twitter_asset.twitterassetsmanager.html)
service helps you to manage resources on the Twitter platform,
like media, webhook, custom profile and welcome message.

To use it, you have to install a [state provider](./using-states) first.
Then register `TwitterAssetsManager` like this:

```ts
import RedisState from '@machiniat/redis';
// highlight-next-line
import TwitterAssetsManager, { saveUploadedMedia } from '@sociably/twitter/asssets';

const app = Sociably.createApp({
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
import { serviceContainer } from '@sociably/core';
import * as Twitter from '@sociably/twitter/components';
import TwitterAssetsManager from '@sociably/twitter/asssets';

app.onEvent(serviceContainer({ deps: [TwitterAssetsManager] })(
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

- [`@sociably/twitter` package reference](https://sociably.js.org/api/modules/twitter.html)
- [Twitter Platform document](https://developers.facebook.com/docs/twitter-platform)
