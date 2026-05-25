---
title: WhatsApp Platform
sidebar_label: WhatsApp
---

`@sociably/whatsapp-platform` enables your app to receive events and send
messages through the [WhatsApp Cloud API](https://developers.facebook.com/docs/whatsapp/cloud-api).

## Install

Install the `core`, `http` and `whatsapp-platform` packages:

```bash
npm install @sociably/core @sociably/http @sociably/whatsapp-platform
```

## Setup

:::tip
You can check the [setup section in the tutorial](https://sociably.js.org/docs/learn/create-app#platform-setup?p=whatsapp).
It walks through the Meta and WhatsApp configuration step by step.
:::

First create a Meta app, enable WhatsApp, register the phone number, and get
the business account ID, number ID, and access token.
Follow the [official setup guide](https://developers.facebook.com/docs/whatsapp/cloud-api/get-started)
for the setup procedures.

Then set up the `http` and `whatsapp-platform` modules like this:

```ts
import Sociably from '@sociably/core';
import Http from '@sociably/http';
import WhatsApp from '@sociably/whatsapp-platform';

const {
  META_APP_ID,
  META_APP_SECRET,
  META_WEBHOOK_VERIFY_TOKEN,
  WHATSAPP_BUSINESS_ACCOUNT_ID,
  WHATSAPP_PHONE_NUMBER,
  WHATSAPP_NUMBER_ID,
  WHATSAPP_ACCESS_TOKEN,
} = process.env;

const app = Sociably.createApp({
  modules: [Http.initModule({ port: 8080 })],
  platforms: [
    WhatsApp.initModule({
      webhookPath: 'webhook/whatsapp',
      appId: META_APP_ID,
      appSecret: META_APP_SECRET,
      accessToken: WHATSAPP_ACCESS_TOKEN,
      webhookVerifyToken: META_WEBHOOK_VERIFY_TOKEN,
      agentSettings: {
        businessAccountId: WHATSAPP_BUSINESS_ACCOUNT_ID,
        phoneNumber: WHATSAPP_PHONE_NUMBER,
        numberId: WHATSAPP_NUMBER_ID,
      },
    }),
  ],
});
```

## Usage

Here is an example that receives text messages and replies with a text message
plus interactive buttons:

```tsx
import Sociably from '@sociably/core';
import * as WhatsApp from '@sociably/whatsapp-platform/components';
import app from './app';

app.onEvent(async ({ platform, event, reply }) => {
  if (platform === 'whatsapp' && event.type === 'text') {
    await reply(
      <>
        <WhatsApp.Text>
          <i>Hello WhatsApp! 👋</i>
        </WhatsApp.Text>
        <WhatsApp.ButtonsTemplate
          buttons={
            <>
              <WhatsApp.ReplyButton title="More 🐱" data="catto" />
              <WhatsApp.ReplyButton title="I want 🐶" data="doggo" />
            </>
          }
          footer={<i>Tap a button to continue</i>}
        >
          <i>Your daily 🐱</i>
        </WhatsApp.ButtonsTemplate>
      </>
    );
  }
});
```

Check API references for the details of
[events](https://sociably.js.org/api/modules/whatsapp.html#whatsappevent) and
[components](https://sociably.js.org/api/modules/whatsapp_components.html).

## Webview

### Auth Setup

WhatsApp webview auth uses a backend-based flow. Configure it by adding the
WhatsApp auth provider to the `webview` platform and setting up the webview
client:

```ts
import Webview from '@sociably/webview';
import RedisState from '@machinat/redis';
import WhatsAppAuth from '@sociably/whatsapp-platform/webview';

const app = Sociably.createApp({
  platforms: [
    Webview.initModule({
      authPlatforms: [WhatsAppAuth],
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
import WhatsAppAuth from '@sociably/whatsapp-platform/webview/client';

const client = new WebviewClient({
  authPlatforms: [new WhatsAppAuth()],
});
```

### Open the Webview

On WhatsApp, a webview link is typically passed as a parameter to a predefined
template button. `WebviewButtonParam` builds that authenticated URL postfix for
you:

```tsx
import * as WhatsApp from '@sociably/whatsapp-platform/components';
import { WebviewButtonParam as WhatsAppWebviewButtonParam } from '@sociably/whatsapp-platform/webview';

app.onEvent(async ({ reply }) => {
  await reply(
    <WhatsApp.PredefinedTemplate
      name="hello_world_example"
      language="en"
      bodyParams={<WhatsApp.TextParam><i>there</i></WhatsApp.TextParam>}
      buttonParams={<WhatsAppWebviewButtonParam />}
    />
  );
});
```

The predefined template must be created in WhatsApp Business first, and its URL
button should point to your webview URL with a parameter placeholder such as
`https://your.domain/webview/{{1}}`.

Check the [webview platform document](https://sociably.js.org/docs/embedded-webview)
to learn more.

## Assets Manager

`WhatsAppAssetsManager` is provided by the platform module. It helps you manage
app subscriptions, reusable uploaded media IDs, and predefined template
creation.

For example, you can subscribe the app and create a predefined template in a
migration or setup script:

```ts
import { serviceContainer } from '@sociably/core';
import WhatsApp from '@sociably/whatsapp-platform';

const { DOMAIN, WHATSAPP_BUSINESS_ACCOUNT_ID } = process.env;

export const up = serviceContainer({
  deps: [WhatsApp.AssetsManager],
})(async (whatsappManager) => {
  await whatsappManager.setAppSubscription();
  await whatsappManager.createPredefinedTemplate(
    WHATSAPP_BUSINESS_ACCOUNT_ID,
    {
      category: 'marketing',
      name: 'hello_world_example',
      language: 'en',
      body: {
        text: 'Hello, {{1}}!',
        examples: [['John'], ['there']],
      },
      buttons: [
        { type: 'quick_reply', text: 'About' },
        {
          type: 'url',
          text: 'Open Webview',
          url: `https://${DOMAIN}/webview/{{1}}`,
          examples: [`https://${DOMAIN}/webview/foo`],
        },
      ],
    },
  );
});
```

It can also reuse uploaded media IDs by tag:

```tsx
import fs from 'fs';
import { serviceContainer } from '@sociably/core';
import * as WhatsApp from '@sociably/whatsapp-platform/components';
import WhatsAppAssetsManager from '@sociably/whatsapp-platform/asset';

const AGENT_NUMBER_ID = process.env.WHATSAPP_NUMBER_ID as string;

app.onEvent(
  serviceContainer({ deps: [WhatsAppAssetsManager] })(
    (assetsManager) =>
      async ({ reply }) => {
        const fooImageId = await assetsManager.getMedia(AGENT_NUMBER_ID, 'foo.image');

        if (fooImageId) {
          await reply(<WhatsApp.Image mediaId={fooImageId} />);
        } else {
          await reply(
            <WhatsApp.Image
              assetTag="foo.image"
              file={{
                data: fs.createReadStream('./assets/foo.jpg'),
                contentType: 'image/jpeg',
              }}
              caption={<i>Hello from media</i>}
            />,
          );
        }
      },
  ),
);
```

Uploaded media with `assetTag` are stored automatically by the platform's
dispatch middleware, so you can reuse them later with
`WhatsAppAssetsManager.getMedia()`.

## Resources

Here are some resources for further reading:

- [`@sociably/whatsapp-platform` package reference](https://sociably.js.org/api/modules/whatsapp.html)
- [WhatsApp Cloud API document](https://developers.facebook.com/docs/whatsapp/cloud-api)
