# WebSocket Module

This package is an underlying module of webview platform for serving WebSocket.
You might want to use [`@machinat/webview`](https://github.com/machinat/machinat/tree/master/packages/webview)
unless you want to serve your own web service.

## Install

```bash
npm install @machinat/core @machinat/http @machinat/websocket
# or with yarn
yarn add @machinat/core @machinat/http @machinat/websocket
```

## Docs

Check the [package references](https://machinat.com/api/modules/websocket.html).

## Setup

#### Back-end
```js
import Machinat from '@machinat/core';
import Http from '@machinat/http';
import WebSocket from '@machinat/websocket';

const DEV = process.env.NODE_ENV !== 'production';

const app = Machinat.createApp({
  modules: [
    Http.initModule({ /* ... */ }),
  ],
  platforms: [
    WebSocket.initModule({ entryPath: '/websocket' }),
  ],
  service: [
    { // same origin policy
      provide: WebSocket.UpgradeVerifier,
      withValue: ({ headers }) => headers.origin === 'https://your.domain.com',
    },
  ]
}).onEvent(async ({ bot, event }) => {
  // send a event when a connection is open
  if (event.type === 'connect') {
    await bot.send({
      category: 'greeting',
      type: 'hello',
      payload: 'world',
    });
  }
});
```

#### Front-end

```js
import Client from '@machinat/websocket/client';

const client = new Client({ url: '/websocket' });

client.onEvent(async ({ event }) => {
  if (event.type === 'hello') {
    await client.send({
      category: 'greeting',
      type: 'hello',
      payload: 'websocket',
    });
  }
});
```
