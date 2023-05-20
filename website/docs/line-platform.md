---
title: Line Platform
sidebar_label: Line
---

The `@sociably/line` platform enable your app to receive/send messages as a
[LINE official account](https://www.linebiz.com/jp-en/other/).

## Install

Install the `core`, `http` and `line` packages:

```bash
npm install @sociably/core @sociably/http @sociably/line
```

## Setup

:::tip
You can check [setup section in the tutorial](https://sociably.js.org/docs/learn/create-app#platform-setup?p=line).
It brings you to set up everything step by step.
:::

First, you need to apply a LINE messaging API channel for the chatbot.
Follow [the official guide](https://developers.line.biz/en/docs/messaging-api/building-bot/)
for the setup procedures.

Then set up the `http` and `line` module like this:

```ts
import Sociably from '@sociably/core';
import Http from '@sociably/http';
import Line from '@sociably/line';

const {
  LINE_PROVIDER_ID,
  LINE_CHANNEL_ID,
  LINE_ACCESS_TOKEN,
  LINE_CHANNEL_SECRET,
} = process.env;

const app = Sociably.createApp({
  modules: [
    Http.initModule({ port: 8080 }),
  ],
  platforms: [
    Line.intiModule({
      webhookPath: '/webhook/line',       // webhook path
      agentSettings: {
        providerId: LINE_PROVIDER_ID,       // provider id of the channel
        channelId: LINE_CHANNEL_ID,         // messaging API channel id
        accessToken: LINE_ACCESS_TOKEN,     // channel access token
        channelSecret: LINE_CHANNEL_SECRET, // channel secret
      },
    }),
  ],
});
```

## Usage

Here's an example to receive events and send replies back:

```tsx
import Sociably from '@sociably/core';
import * as Line from '@sociably/line/components';
import app from './app';

app.onEvent(async ({ platform, event, reply }) => {
  if (platform === 'line' && event.type === 'text') {
    await reply(
      <Line.Expression
        quickReplies={
          <Line.QuickReply>
            <Line.PostbackAction label="I want 🐶" data="doggo" />
          </Line.QuickReply>
        }
      >
        Hello LINE! 👋
        <Line.ButtonTemplate
          altText="You daily 🐱: https://cataas.com/cat"
          thumbnailImageUrl="https://cataas.com/cat"
          actions={
            <Line.PostbackAction label="More" data="catto" />
          }
        >
          You daily 🐱
        </Line.ButtonTemplate>
      </Line.Expression>
    );
  }
});
```

Check API references for the details of [events](https://sociably.js.org/api/modules/line#lineevent)
and [components](https://sociably.js.org/api/modules/line_components).

## Webview

### Auth Setup

To use [webviews](./embedded-webview) in LINE,
configure the app with these steps:

1. Create a [LIFF app](https://developers.line.biz/en/docs/liff/registering-liff-apps/)
   with URL to the webview page with `platform=line` query.
   Like `https://your.server.domain/webview?platform=line`.
2. Set up `line` and `webview` platform like this:

```ts
import Webview from '@sociably/webview';
import Line from '@sociably/line';
import LineAuth from '@sociably/line/webview';

const { LINE_LIFF_ID } = process.env;

const app = Sociably.createApp({
  platforms: [
    Line.initModule({
      // add the login channel id
      agentSettings: {
        // ...
        liff: { default: LINE_LIFF_ID },
      },
    }),
    Webview.initModule({
      authPlatforms: [
        // add the auth provider
        LineAuth,
      ]
      // ...
    }),
  ],
});
```

3. Expose LIFF id in `next.config.js`:

```js
const { LINE_LIFF_ID } = process.env;

module.exports = {
  publicRuntimeConfig: {
    // highlight-next-line
    LINE_LIFF_ID,
  },
};
```

4. Set up the `WebviewClient` in the webview page:

```ts
import getConfig from 'next/config';
import WebviewClient from '@sociably/webview/client';
import LineAuth from '@sociably/line/webview/client';

const {
  publicRuntimeConfig: { LINE_LIFF_ID },
} = getConfig();

const client =  new WebviewClient({
  authPlatforms: [
    new LineAuth({ liffId: LINE_LIFF_ID }),
  ],
});
```

### Open the Webview

The webview can be opened by a `WebviewAction` in the chatroom.
Like:

```jsx
import * as Line from '@sociably/line/components';
import { WebviewAction as LineWebviewAction } from '@sociably/line/webview';

app.onEvent(async ({ reply }) => {
  await reply(
    <Line.ButtonTemplate
      altText="Hello World"
      actions={
        <LineWebviewAction label="Open 📤" />
      }
    >
      Hello Webview!
    </Line.ButtonTemplate>
  );
});
```

The users will be logged in with LINE account in the webview.
Check the [webview document](https://sociably.js.org/docs/embedded-webview)
to learn more.

## Assets Manager

[`LineAssetsManager`](https://sociably.js.org/api/classes/line_asset.lineassetsmanager.html)
service helps you to manage resources on the LINE platform,
like [richmenu](https://developers.line.biz/en/docs/messaging-api/using-rich-menus/#using-rich-menus-introduction).

To use it, you have to install a [state provider](./using-states) first.
Then register `LineAssetsManager` like this:

```ts
import RedisState from '@machiniat/redis';
// highlight-next-line
import LineAssetsManager from '@sociably/line/asssets';

const app = Sociably.createApp({
  services: [
    // highlight-next-line
    LineAssetsManager,
  ],
  platforms: [
    Line.initModule({/* ... */}),
  ],
  modules: [
    RedisState.initModule({
      clientOptions: { url: REDIS_URL },
    }),
  ],
});
```

Here is an example to reuse a richmenu:

```tsx
import { serviceContainer } from '@sociably/core';
import * as Line from '@sociably/line/components';
import LineAssetsManager from '@sociably/line/asssets';

app.onEvent(
  serviceContainer({ deps: [LineAssetsManager] })(
    (assetsManager) =>
      async ({ reply }) => {
        const fooMenuId = await assetsManager.getRichMenu('foo.menu');
        await reply(<Line.LinkRichMenu id={fooMenuId} />);
      }
  )
);
```

## Resources

Here are some resources for further reading:

- [`@sociably/line` package reference](https://sociably.js.org/api/modules/line.html)
- [LINE Messaging API document](https://developers.line.biz/en/docs/messaging-api/overview/)
- [LINE Front-end Framework document](https://developers.line.biz/en/docs/liff/overview/)
