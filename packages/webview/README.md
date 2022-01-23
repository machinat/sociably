# Webview Platform

Serve webviews that integrated with the chat platforms.

- Host a front-end app powered by [Next.js](https://nextjs.org/).
- Automatically log in users with the chat platform account.
- Mutually communicate to the server with WebSocket.

This package combines three modules: [`@machinat/auth`](https://github.com/machinat/machinat/tree/master/packages/auth),
[`@machinat/next`](https://github.com/machinat/machinat/tree/master/packages/next)
and [`@machinat/websocket`](https://github.com/machinat/machinat/tree/master/packages/webview).
You can use them separatedly if you don't need them all.

## Install

```bash
npm install react react-dom next @machinat/core @machinat/http @machinat/webview
# or with yarn
yarn add react react-dom next @machinat/core @machinat/http @machinat/webview
```

## Docs

Check the [Embedded Webview](https://machinat.com/docs/embedded-webview)
document or the [API references](https://machinat.com/api/modules/webview.html).

## Setup

#### Back-End

Assume you have the Next.js app directory at `./webview`, set up webview platform like this:

```ts
// src/app.js
import Machinat from '@machinat/core';
import Http from '@machinat/http';
import Webview from '@machinat/webview';
import Messenger from '@machinat/messenger';
import MessengerWebviewAuth from '@machinat/messenger/webview';
import nextConfigs from '../webview/next.config.js';

const { DOMAIN, WEBVIEW_AUTH_SECRET, NODE_ENV, MESSENGER_APP_ID } = process.env;
const DEV = NODE_ENV !== 'production';

const app = Machinat.createApp({
  modules: [
    Http.initModule({/* ... */}),
  ],
  platforms: [
    Messenger.initModule({/* ... */}),
    Webview.intiModule({
      webviewHost: DOMAIN,
      webviewPath: '/webview', // have to match `basePath` in next.config.js
      authSecret: WEBVIEW_AUTH_SECRET,
      authPlatforms: [
        // auth providers from platforms
        MessengerWebviewAuth,
      ],
      nextServerOptions: {
        dev: DEV,              // use dev mode or not
        dir: './webview',      // the front-end app dir
        conf: nextConfigs,     // import configs from next.config.js
      },
    }),
  ],
});

app.onEvent(async ({ event, bot }) => {
  if (event.platform === 'webview' && event.type === 'connect') {
    await bot.send(event.channel, {
      type: 'hello',
      payload: 'hello from server',
    });
  }
});
app.start();
```

You can create the front-end app with `npx create-next-app` if you don't have one.

#### Front-End

Set up the Next.js app like this:

```js
// webview/next.config.js
module.exports = {
  distDir: '../dist',     // the path of built front-end codes
  basePath: '/webview',   // have to match `webviewPath` on back-end
  publicRuntimeConfig: {
    // export settings to front-end if needed
    messengerAppId: process.env.MESSENGER_APP_ID,
  },
};
```

Then you can use `WebviewClient` in the front-end pages like this:

```js
// webview/pages/index.js
import { useEffect } from 'react';
import getConfig from 'next/config';
import WebviewClient from '@machinat/webview/client';
import MessengerWebviewAuth from '@machinat/messenger/webview/client';

// get settings if needed
const { publicRuntimeConfig } = getConfig();
// to activate publicRuntimeConfig
export const getServerSideProps = () => ({ props: {} });

const client = new WebviewClient({
  // prevent connecting in the back-end while server rendering
  mockupMode: typeof window === 'undefined',
  // auth providers from platforms
  authPlatforms: [
    new MessengerWebviewAuth({
      appId: publicRuntimeConfig.messengerAppId,
    }),
  ],
});

export default function Home() {
  const greetingMsg = useEventReducer(
    client,
    (msg, event) => event.type === 'hello' ? event.payload : msg,
    null
  );
  useEffect(
    () => {
      client.send({ type: 'hello', payload: 'hello from webview' });
    },
    [greetingMsg]
  )
  return <h1>{greetingMsg} || 'connecting...'</h1>
}
```
