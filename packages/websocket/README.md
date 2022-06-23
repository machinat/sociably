# WebSocket Module

This package is an underlying module of webview platform for serving WebSocket.
You might want to use [`@sociably/webview`](https://github.com/machinat/sociably/tree/master/packages/webview)
unless you want to serve your own web service.

## Install

```bash
npm install @sociably/core @sociably/http @sociably/websocket
# or with yarn
yarn add @sociably/core @sociably/http @sociably/websocket
```

## Docs

Check the [package reference](https://sociably.js.org/api/modules/websocket.html).

## Setup

#### Back-end
```js
import Sociably from '@sociably/core';
import Http from '@sociably/http';
import WebSocket from '@sociably/websocket';

const DEV = process.env.NODE_ENV !== 'production';

const app = Sociably.createApp({
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
import Client from '@sociably/websocket/client';

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
