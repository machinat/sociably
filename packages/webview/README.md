# Webview Platform

Serve webview integrated with the account of chat platforms. And communicate to
server with a real-time WebScoket connection.

This package combines three module: [`@machinat/auth`](https://github.com/machinat/machinat/tree/master/packages/auth),
[`@machinat/next`](https://github.com/machinat/machinat/tree/master/packages/next)
and [`@machinat/websocket`](https://github.com/machinat/machinat/tree/master/packages/webview).
You can use them separatedly if you don't need them all.

## Install

```bash
npm install @machinat/core @machinat/http @machinat/webview
# or with yarn
yarn add @machinat/core @machinat/http @machinat/webview
```

## Docs

Check the [Embedded Webview](https://machinat.com/docs/embedded-webview)
document for the usage guide, and the [package reference](https://machinat.com/api/modules/webview.html)
for API details.

## Setup

#### Back-end

Assume you have the front-end project at `../webview`, set up the platform like
this:

```ts
import Machinat from '@machinat/core';
import Http from '@machinat/http';
import Webview from '@machinat/webview';
import Messenger from '@machinat/messenger';
import MessengerAuthorizer from '@machinat/messenger/webview';
import nextConfigs from '../webview/next.config.js';

const { DOMAIN, WEBVIEW_AUTH_SECRET, NODE_ENV, MESSENGER_APP_ID } = process.env;
const DEV = NODE_ENV !== 'production';

const app = Machinat.createApp({
  modules: [
    Http.initModule({ /* ... */ }),
  ],
  platforms: [
    Messenger.initModule({ /* ... */ }),
    Webview.intiModule({
      webviewHost: DOMAIN,
      webviewPath: '/webview',    // have to match basePath of next configs
      authSecret: WEBVIEW_AUTH_SECRET,
      nextServerOptions: {
        dev: DEV,                 // use dev mode or not
        dir: '../webview',        // the next.js project dir
        conf: {
          ...nextConfigs,         // import the configs from next.config.js
          publicRuntimeConfig:    // expose settings to front-end if needed
            messengerAppId: MESSENGER_APP_ID,
          }
        },
      },
    }),
  ],
  services: [
    // register authorizer of chat platforms
    { provide: Webview.AuthorizerList, withProvider: MessengerAuthorizer },
  ]
});
```

#### Front-end

```js
import Client from '@machinat/webview/client';
import { MessengerClientAuthorizer } from '@machinat/messenger/webview';

// get settings if needed
const { publicRuntimeConfig } = getConfig();

const client = new WebviewClient(
  typeof window === 'undefined'
    // prevent making connection while server rendering
    ? { mockupMode: true, authorizers: [] }
    : {
        authorizers: [
          // corresponded client side authorizers
          new MessengerClientAuthorizer({
            appId: publicRuntimeConfig.messengerAppId,
          }),
        ],
      }
);
```
