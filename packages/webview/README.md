# Webview Platform

Serve webviews that integrated with the chat platforms.

- Host a front-end app powered by [Next.js](https://nextjs.org/).
- Automatically log in users with the chat platform account.
- Mutually communicate to the server with WebSocket.

This package combines three modules: [`@sociably/auth`](https://github.com/machinat/sociably/tree/master/packages/auth),
[`@sociably/next`](https://github.com/machinat/sociably/tree/master/packages/next)
and [`@sociably/websocket`](https://github.com/machinat/sociably/tree/master/packages/webview).
You can use them separatedly if you don't need them all.

## Install

```bash
npm install react react-dom next @sociably/core @sociably/http @sociably/webview
# or with yarn
yarn add react react-dom next @sociably/core @sociably/http @sociably/webview
```

## Docs

Check the [Embedded Webview](https://sociably.js.org/docs/embedded-webview)
document and the [API references](https://sociably.js.org/api/modules/webview.html).

## Setup

#### Back-End

Assume you have the Next.js app directory at `./webview`, set up webview platform like this:

```ts
// src/app.js
import Sociably from '@sociably/core';
import Http from '@sociably/http';
import Webview from '@sociably/webview';
import Facebook from '@sociably/facebook';
import FacebookWebviewAuth from '@sociably/facebook/webview';
import nextConfigs from '../webview/next.config.js';

const { DOMAIN, WEBVIEW_AUTH_SECRET, NODE_ENV, FACEBOOK_APP_ID } = process.env;
const DEV = NODE_ENV !== 'production';

const app = Sociably.createApp({
  modules: [
    Http.initModule({/* ... */}),
  ],
  platforms: [
    Facebook.initModule({/* ... */}),
    Webview.intiModule({
      webviewHost: DOMAIN,
      webviewPath: '/webview', // have to match `basePath` in next.config.js
      authSecret: WEBVIEW_AUTH_SECRET,
      authPlatforms: [
        // auth providers from platforms
        FacebookWebviewAuth,
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
    await bot.send(event.thread, {
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
    facebookAppId: process.env.FACEBOOK_APP_ID,
  },
};
```

Then you can use `WebviewClient` in the front-end pages like this:

```js
// webview/pages/index.js
import { useEffect } from 'react';
import getConfig from 'next/config';
import WebviewClient from '@sociably/webview/client';
import FacebookWebviewAuth from '@sociably/facebook/webview/client';

// get settings if needed
const { publicRuntimeConfig } = getConfig();
// to activate publicRuntimeConfig
export const getServerSideProps = () => ({ props: {} });

const client = new WebviewClient({
  // prevent connecting in the back-end while server rendering
  mockupMode: typeof window === 'undefined',
  // auth providers from platforms
  authPlatforms: [
    new FacebookWebviewAuth({
      appId: publicRuntimeConfig.facebookAppId,
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
