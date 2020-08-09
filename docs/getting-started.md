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

This document will bring you through how to make a cross-platform app with enriched conversational UIs step by step.

## Install

Machinat codebase is separated into packages that you can optionally install only what you need. First you need to add the `core` module and the `http` module for receiving HTTP request:

```sh
npm install @machinat/core @machinat/http
# or with yarn
yarn add @machinat/core @machinat/http
```

### Platforms

Platform modules listen to external events from sources like webhook, then emit the events through the app. They also provide utilities to make reaction if possible.

You are free to pick any platforms you need to communicate with. The example app above subscribe events from 2 platforms: `Messenger` and `Line`. Install the platform module packages like:

```sh
npm install @machinat/messenger @machinat/line # ...
# or with yarn
yarn add @machinat/messenger @machinat/line # ...
```

For now we support the platforms listed below, please check the readme of the package for the usage guide.

- Messenger - [`@machinat/messenger`](../packages/machinat-messenger), receive/send messages as a Facebook page in [Messenger](https://www.messenger.com).
- LINE - [`@machinat/line`](../packages/machinat-line), receive/send messages as a [LINE](https://line.me) official account.
- Next.js - [`@machinat/next`](../packages/machinat-next), serve your web app with [Next.js](https://nextjs.org/).
- WebSocket - [`@machinat/websocket`](../packages/machinat-websocket), connect to the web front-end with [WebSocket](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API).

## Enabling JSX

To enable Machinat JSX syntax, you might need to configure the transpiling environment first. After setup, you can import `Machinat` at the file to make JSX syntax worked like:

```js
import Machinat from '@machinat/core';

const greeting = <p>Hello World!</p>;
```

If you are not familiar with transpiling JavaScript, we recommend [Babel.js](https://babeljs.io/docs/en/) for beginners. Check [this example](../examples/cross-platform) about how to set up the project.

### With Babel

First install `@machinat/babel-preset` package:

```sh
npm install --save-dev @machinat/babel-preset
# or using yarn
yarn --dev @machinat/babel-preset
```

Then add it into `babel.config.json`:

```json
{
  "presets": ["@machinat/babel-preset"]
}
```

### With TypeScript

Add the following settings of the `compilerOptions` in `tsconfig.json`:

```json
{
  "compilerOptions": {
    ...
    "jsx": "react",
    "jsxFactory": "Machinat.createElement",
    "jsxFragmentFactory": "Machinat.Fragment"
  }
}
```

## Listening to HTTP

The `@machinat/http` module provide underlying utilities for platforms need receiving HTTP request. `HTTP.initModule()` takes an options object parameter the same as [`http.Server#listen()`](https://nodejs.org/dist/latest/docs/api/net.html#net_server_listen_options_callback)like:

```js
HTTP.initModule({
  host: '::',
  port: 8080,
  ipv6Only: true,
})
```

When `app.start()`, a HTTP server will be created and start listening for requests.

If you have multiple platforms requiring HTTP entry, you need to set the route path at platform options like in the example:

```js
Messenger.initModule({
  webhookPath: '/webhook/messenger',
  ...
})
```

Each platform's route path should be configured with no conflict. Please check the docs of platform package for more usage details.

## Starting App

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

Learn how to receive and handle events in [next section](receiving-events.md).
