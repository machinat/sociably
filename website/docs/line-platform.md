---
title: Line Platform
sidebar_label: Line
---

The `@machinat/line` platform enable your app to receive/send messages as a
[LINE official account](https://www.linebiz.com/jp-en/other/).

## Install

Install the `core`, `http` and `line` packages:

```bash
npm install @machinat/core @machinat/http @machinat/line
```

## Setup

:::tip
You can check [setup section in the tutorial](https://machinat.com/docs/learn/create-app#platform-setup?p=line).
It brings you to set up everything step by step.
:::

First, you need a LINE messaging API channel to use with.
You can follow [the official guide](https://developers.line.biz/en/docs/messaging-api/building-bot/)
to create one.

Then set up the `http` and `line` module like this:

```ts
import Machinat from '@machinat/core';
import Http from '@machinat/http';
import Line from '@machinat/line';

const {
  LINE_PROVIDER_ID,
  LINE_CHANNEL_ID,
  LINE_ACCESS_TOKEN,
  LINE_CHANNEL_SECRET,
} = process.env;

const app = Machinat.createApp({
  modules: [
    Http.initModule({ port: 8080 }),
  ],
  platforms: [
    Line.intiModule({
      webhookPath: '/webhook/line',       // webhook path
      channelId: LINE_CHANNEL_ID,         // messaging API channel id
      providerId: LINE_PROVIDER_ID,       // provider id of the channel
      accessToken: LINE_ACCESS_TOKEN,     // channel access token
      channelSecret: LINE_CHANNEL_SECRET, // channel secret
    }),
  ],
});
```

## Usage

Here's an example to receive events and send replies back:

```tsx
import Machinat from '@machinat/core';
import * as Line from '@machinat/line/components';
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

Check the API references for the details of [events](https://machinat.com/api/modules/line#lineevent)
and [components](https://machinat.com/api/modules/line_components).

## Webview

### Auth Setup

To use [webviews](./embedded-webview) in LINE,
configure the app with these steps:

1. Create a [LIFF app](https://developers.line.biz/en/docs/liff/registering-liff-apps/)
   with URL to the webview page with `platform=line` query.
   Like `https://your.server.domain/webview?platform=line`.
2. Set up `line` and `webview` platform like this:

```ts
import Webview from '@machinat/webview';
import Line from '@machinat/line';
import LineAuth from '@machinat/line/webview';

const { LINE_LIFF_ID } = process.env;

const app = Machinat.createApp({
  platforms: [
    Line.initModule({
      // add the login channel id
      liffChannelIds: [LINE_LIFF_ID.split('-')[0]],
      // ...
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

```js {5}
module.exports = {
  distDir: '../dist',
  basePath: '/webview',
  publicRuntimeConfig: {
    lineLiffId: process.env.LINE_LIFF_ID,
  },
};
```

4. Set up the `WebviewClient` in the webview page:

```ts
import getConfig from 'next/config';
import WebviewClient from '@machinat/webview/client';
import LineAuth from '@machinat/line/webview/client';

const { publicRuntimeConfig } = getConfig();

const client =  new WebviewClient({
  authPlatforms: [
    new LineAuth({
      liffId: publicRuntimeConfig.lineLiffId,
    }),
  ],
});
```

### Open the Webview

The webview can be opened by a `WebviewAction` in the chatroom.
Like:

```jsx
import * as Line from '@machinat/line/components';
import { WebviewAction as LineWebviewAction } from '@machinat/line/webview';

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
Check the [webview document](https://machinat.com/docs/embedded-webview)
to learn more.

## Assets Manager

[`LineAssetsManager`](https://machinat.com/api/classes/line_asset.lineassetsmanager.html)
service helps you to manage resources on the LINE platform,
like [richmenu](https://developers.line.biz/en/docs/messaging-api/using-rich-menus/#using-rich-menus-introduction).

To use it, you have to install a [state provider](./using-states) first.
Then register `LineAssetsManager` like this:

```ts {2,12}
import { FileState } from '@machinat/dev-tools';
import LineAssetsManager from '@machinat/line/asssets';

const app = Machinat.createApp({
  modules: [
    FileState.initModule({ path: '.state_data.json' }),
  ],
  platforms: [
    Line.initModule({/* ... */}),
  ],
  services: [
    LineAssetsManager,
  ],
});
```

Here is an example to reuse a richmenu:

```tsx
import { makeContainer } from '@machinat/core';
import * as Line from '@machinat/line/components';
import LineAssetsManager from '@machinat/line/asssets';

app.onEvent(
  makeContainer({ deps: [LineAssetsManager] })(
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

- [`@machinat/line` package reference](https://machinat.com/api/modules/line.html)
- [LINE Messaging API document](https://developers.line.biz/en/docs/messaging-api/overview/)
- [LINE Front-end Framework document](https://developers.line.biz/en/docs/liff/overview/)
