# Http Module

This module provide HTTP listening capability to all the services require it.
For example, to serve a webhook for subscribing events from chat platform.

## Install

```bash
npm install @sociably/core @sociably/http
# or with yarn
yarn add @sociably/core @sociably/http
```

## Docs

Check the [package reference](https://sociably.js.org/api/modules/http.html).

## Setup

Use `listenOptions` to set the network options for [`server.listen()`](https://nodejs.org/dist/latest/docs/api/net.html#net_server_listen_options_callback).

```js
import Sociably from '@sociably/core';
import Http from '@sociably/http';

const app = Sociably.createApp({
  modules: [
    Http.initModule({
      listenOptions: {
        port: 8080,
        host: 'localhost',
      }
    }),
  ],
});
```

## Usage

Provide `Http.RequestRouteList` or `Http.UpgradeRouteList` (for [WebSocket](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API))
to register RPC style routes. All the requests under the registered `path` will
be received by the handler. You can also use `default: true` to catch all
unmatch requests.

```js
const app = Sociably.createApp({
  modules: [
    Http.initModule({ /* ... */ }),
  ],
  service: [
    { // route listening to /api
      provide: Http.RequestRouteList,
      withValue: {
        name: 'my_api',
        path: '/api',
        handler: (req, res) => {
          // handle http requests
        },
      }
    },
    { // default request route
      provide: Http.RequestRouteList,
      withValue: {
        name: 'default',
        default: true,
        handler: (req, res) => {
          // catch requests not matching any route
        },
      }
    },
    {  // handle WebSocket connection
      provide: Http.UpgradeRouteList,
      withValue: {
        name: 'web_socket',
        path: '/',
        handler: (req, head, socket) => {
          // handle http upgrade requests
        },
      }
    },
  ],
});
```
