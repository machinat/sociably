---
title: Line Platform
sidebar_label: Line
---

The `@machinat/line` platform enable your app to receive/send messages as a
[LINE official account](https://www.linebiz.com/jp-en/other/).

## Install

Install `core`, `http` and `line` package with npm:

```bash
npm install @machinat/core @machinat/http @machinat/line
```

Or with yarn:

```bash
yarn add @machinat/core @machinat/http @machinat/line
```

## Setup

:::tip
You can check the [setup section of our tutorial](https://machinat.com/docs/learn/create-app#platform-setup?p=line).
It brings you to create a LINE channel and configure your app step by step.
:::

First, you have to configure a LINE messaging API channel for your app to use.
You can follow the steps in [this official guide](https://developers.line.biz/en/docs/messaging-api/building-bot/)
to do it.

Then register the `http` and `line` module with the settings like this:

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
      webhookPath: '/webhook/line',           // webhook path
      channelId: LINE_CHANNEL_ID,             // messaging API channel id
      providerId: LINE_PROVIDER_ID,           // provider id of the channel
      accessToken: LINE_ACCESS_TOKEN,         // channel access token
      channelSecret: LINE_CHANNEL_SECRET,     // channel secret
    }),
  ],
});
```

## Usage

Here is an example to receive events and send replies back:

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

Check the package reference for the details of [event types](https://machinat.com/api/modules/line.html#lineevent)
and [component APIs](https://machinat.com/api/modules/line_components.html).

## Webview

To integrate chatbot with a [LIFF](https://developers.line.biz/en/docs/liff/overview/)
webview, add [`@machinat/webview`](https://github.com/machinat/machinat/tree/master/packages/webview)
platform and set up with these steps:

1. [Create a LIFF app](https://developers.line.biz/en/docs/liff/registering-liff-apps/)
   with url `https://your.server.domain/webview?platform=line`. The url should
   link to your webview page with `platform=line` query.
2. Add the LIFF **login channel** id in `liffChannelIds` options.
3. Add `LineAuthorizer` into the `Webview.AuthorizerList`.
4. Expose the LIFF app id to front-end.

```ts {1-2,7,17,25-27,33}
import Webview from '@machinat/webview';
import LineAuthorizer from '@machinat/line/webview';
// ...

const {
  // ...
  LINE_LIFF_ID,
} = process.env;

const app = Machinat.createApp({
  modules: [
    Http.initModule({ port: 8080 }),
  ],
  platforms: [
    Line.initModule({
      // ...
      liffChannelIds: [LINE_LIFF_ID.split('-')[0]],
    }),
    Webview.intiModule({
      // ...
      nextServerOptions: {
        // ...
        conf: {
          ...nextConfigs,
          publicRuntimeConfig: {
            lineLiffId: LINE_LIFF_ID,
          }
        }
      }
    }),
  ],
  services: [
    { provide: Webview.AuthorizerList, withProvider: LineAuthorizer },
  ],
});
```

The webview can be opened by the LIFF app url:

```tsx
const { LINE_LIFF_ID } = process.env;
const liffUrl = `https://liff.line.me/${LINE_LIFF_ID}`;

app.onEvent(async ({ reply }) => {
  await reply(
    <Line.ButtonTemplate
      altText={liffUrl}
      actions={<Line.UriAction label="Open 📤" uri={liffUrl} />}
    >
      Hello Webview!
    </Line.ButtonTemplate>
  );
});
```

Then add `LineClientAuthorizer` in the webview client:

```ts
import getConfig from 'next/config';
import WebviewClient from '@machinat/webview/client';
import { LineClientAuthorizer } from '@machinat/line/webview';

const { publicRuntimeConfig } = getConfig();

const client =  new WebviewClient({
  authorizers: [
    new LineClientAuthorizer({
      liffId: publicRuntimeConfig.lineLiffId,
    }),
  ],
});
```

The client can now communicate to server with the LINE user and chat info. To
learn more about the webview platform usage, check the [document](https://machinat.com/docs/embedded-webview).

## Assets Manager

[`LineAssetsManager`](https://machinat.com/api/classes/line_asset.lineassetsmanager.html)
service helps you to manage the resources like [richmenu](https://developers.line.biz/en/docs/messaging-api/using-rich-menus/#using-rich-menus-introduction).
Make sure you have a state storage installed, and register the service like:

```ts {2,12}
import { FileState } from '@machinat/local-state';
import LineAssetsManager from '@machinat/line/asssets';

const app = Machinat.createApp({
  modules: [
    FileState.initModule({ path: '.state_file' }),
  ],
  platforms: [
    Line.initModule({ /* ... */ }),
  ],
  services: [
    LineAssetsManager,
  ],
});
```

Here is an example to reuse dynamic richmenu:

```tsx
import { makeContainer } from '@machinat/core/service';
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
