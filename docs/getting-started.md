# Getting Started

A simplest cross-platform Machinat app may look like this:

```js
import Machinat from '@machinat/core';
import HTTP from '@machinat/http';
import Messenger from '@machinat/messenger';
import Line from '@machinat/line';

const ENV = process.env;

Machinat.createApp({
  modules: [
    HTTP.initModule({ port: 8080 }),
  ],
  platforms: [
    Messenger.initModule({
      webhookPath: '/webhook/messenger',
      pageId: ENV.MESSENGER_PAGE_ID,
      accessToken: ENV.MESSENGER_ACCESS_TOKEN,
      appSecret: ENV.MESSENGER_APP_SECRET,
      verifyToken: ENV.MESSENGER_VERIFY_TOKEN,
    }),
    Line.initModule({
      webhookPath: '/webhook/line',
      providerId: ENV.LINE_PROVIDER_ID,
      channelId: ENV.LINE_CHANNEL_ID,
      channelSecret: ENV.LINE_CHANNEL_SECRET,
      accessToken: ENV.LINE_ACCESS_TOKEN,
    }),
  ],
})
  .onEvent(async ({ bot, channel }) => {
    await bot.render(channel, (
      <>
        Hello World!
        <img src="http://machinat.io/greeting.png" />
      </>
    ));
  })
  .start();
```

This docs will bring you through how to make a cross-platform app with enriched conversational UIs step by step!

## Install

Machinat codebase is separated into packages that you can optionally install only what you need. First add the _core_ and _http_ module:

```sh
npm install @machinat/core @machinat/http
# or with yarn
yarn add @machinat/core @machinat/http
```

## Platforms

A platform is an external source where events would receive from and possibly you can dispatch reactions to. It could be any event-based source like webhook, websocket, e-mail or even console!

The example app above subscribe events from 2 platforms: `Messenger` and `Line`. You can add your ones:

```sh
npm install @machinat/messenger @machinat/line # ...
# or with yarn
yarn add @machinat/messenger @machinat/line # ...
```

For now we support these platforms below, please check the docs in the package for the usage.

- [`@machinat/messenger`](packages/machinat-messenger)
- [`@machinat/line`](packages/machinat-line)
- [`@machinat/next`](packages/machinat-next)
- [`@machinat/websocket`](packages/machinat-websocket)

## Listening to HTTP

The `@machinat/http` module provide underlying utilities for platforms need receiving HTTP request. `HTTP.initModule()` takes an options object parameter the same as [`http.Server#listen()`](https://nodejs.org/dist/latest/docs/api/net.html#net_server_listen_options_callback)like:

```js
HTTP.initModule({
  host: '::',
  port: 8080,
  ipv6Only: true,
})
```

When `app.start()`, a HTTP server will then be created and start listening for requests.

If you have several platforms you might need to setup the routes for each one like in the example:

```js
Messenger.initModule({
  webhookPath: '/webhook/messenger',
  ...
})
```

The route path should be configure at platform options for registering. Please check the docs of platform package for the details!

## Start App

After all modules configured, you must call `app.start()` to make everything work. It initiate the necessary services for the app to run.

```js
const app = Machinat.createApp({ ... });

app
  .start()
  .then(() => console.log('App Started!'))
  .catch(err => console.error(err));
```

`app.start()` returns a promise, your app is ready to receive events after it resolved!

## Next

Now you are able to make your first app run! The next section will guide you how to [Receive Events](docs/receive-event.md) and handle them.
