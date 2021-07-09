---
title: Getting Started
slug: /
---

Welcome to Machinat framework document!

If you are learning about Machinat for the first time, we recommend to start from [the tutorial](/docs/learn). It'll bring you to build a complete Machinat app step by step.

## System Requirement

- [Node.js](https://nodejs.org/) 10.13 or later

## Create Machinat App

We recommend to create a Machinat app project with `@machinat/create-app`
initiator. Run this command to create a hello-world project:

```bash
npm init @machinat/app -- -p <platform> [-p <platform> ...] <project-path>
```

Or using `yarn`:

```bash
yarn create @machinat/app -p <platform> [-p <platform> ...] <project-path>
```

### Platforms

For now the following platform options is supported:

- `messenger` - receive/send messages as a Facebook page in [Messenger](https://www.messenger.com).
- `telegram` - receive/send messages as a bot in [Telegram](https://telegram.org).
- `line` - receive/send messages as a [LINE](https://line.me) official account.
- `webview` - serve webviews with authorization integrated with chat platforms. And communicate to server with [WebSocket](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API).

### Project Directory Structure

After the command is finished, the project folder with following structure will
be created:

```
.
├── src
│   ├── cli                     # folder of executable scripts
│   │   └── ...
│   ├── components              # folder of chat UI components
│   │   └── ...
│   ├── handlers                # folder of event handlers
│   │   ├── handleMessage.tsx   # message events handler
│   │   └── ...
│   ├── migrations              # folder of migrations
│   │   ├── 0-init-app.ts       # initial migration
│   │   └── ...
│   ├── webview                 # folder of webview front-end project
│   │   ├── pages
│   │   │   └── index.tsx       # root webview page
│   │   ├── next.config.js
│   │   └── tsconfig.json
│   ├── main.ts                 # control flow for events
│   ├── app.ts                  # register platforms, modules and services
│   └── index.ts                # entry point to start server
├── package.json
├── package-lock.json
├── tsconfig.json
├── .env                        # environments file
└── .env.example
```


### Configs

The `.env` file contains environment configurations that need to filled before
starting app. You can check `.env.example` for the instructions to fill each
configuration.

### Migrations

To connect your app with chat platforms, you might have to make some API calls
for setting up resources. For example, setting up the webhook address. And these
operations have to be done every time your app is deployed on a new environment.

To automate these operations, we can use strategy like the [DB Schema Migration](https://en.wikipedia.org/wiki/Schema_migration).
Run command `npm run migrate` to execute migration jobs before starting
development or deploying a new version.

Check `src/migrations/0-init-app.ts` file to see the initiating jobs. You can
edit them and add your own jobs. Every migration will be executed exactly only
once per environment. So you have to add new migration file for new changes
after your app is online.

:::tip
Use `npm run migrate -- --down` command to revert the migrations.
:::

:::info
If you app works on Messenger platform, make sure the server is running up
while executing the initial migration.
:::

### Start Dev Server

During development you can use `npm run dev` command to start app in development
mode. The command do 2 things:

1. Start a dev server up. It would automatically refresh when codes changed.
2. Create a https tunnel connected to a _https://xxx.t.machinat.dev_ endpoint.
   So your local server can accept webhook requests from the chat platforms.

Try talk to your bot on the chat platform after server started. The hello-world
app should be working now if you finish all the setup.

## Manually Install

:::tip
The rest sections of this page is for creating your project from zero step by
step. You can skip if you choose to use the initiator above.
:::


A simplest cross-platform Machinat app may look like this:

```js
import Machinat from '@machinat/core';
import Http from '@machinat/http';
import Messenger from '@machinat/messenger';

const ENV = process.env;

Machinat.createApp({
  modules: [
    Http.initModule({ port: 8080 }),
  ],
  platforms: [
    Messenger.initModule({
      webhookPath: '/webhook/messenger',
      pageId: ENV.MESSENGER_PAGE_ID,
      accessToken: ENV.MESSENGER_ACCESS_TOKEN,
      appSecret: ENV.MESSENGER_APP_SECRET,
      verifyToken: ENV.MESSENGER_VERIFY_TOKEN,
    }),
  ],
})
  .onEvent(async ({ bot, event }) => {
    await bot.render(event.channel, (
      <>
        <p>Hello World!</p>
        <img src="http://machinat.io/greeting.png" />
      </>
    ));
  })
  .start();
```

### Core Modules

This document will bring you through how to make a cross-platform app with enriched conversational UIs step by step.

Machinat codebase is separated into packages that you can optionally install
only what you need. First you need to add the `core` module and also the `http`
module for receiving HTTP request:

```bash
npm install @machinat/core @machinat/http
# or with yarn
yarn add @machinat/core @machinat/http
```

### Platforms

Platform modules listen to external events from sources like webhook, then emit
the events through the app. They also provide utilities to make reaction if
possible. Install the platform module packages like:

```bash
npm install @machinat/messenger @machinat/webview # ...
# or with yarn
yarn add @machinat/messenger @machinat/webview # ...
```

For now we support these platforms listed below, please check the readme of the package for the usage guide.

- Messenger - [`@machinat/messenger`](https://github.com/machinat/machinat/tree/master/packages/messenger), receive/send messages as a Facebook page in [Messenger](https://www.messenger.com).
- Telegram - [`@machinat/telegram`](https://github.com/machinat/machinat/tree/master/packages/telegram), receive/send messages as a Telegram bot.
- LINE - [`@machinat/line`](https://github.com/machinat/machinat/tree/master/packages/line), receive/send messages as a [LINE](https://line.me) official account.
- Webview - [`@machinat/webview`](https://github.com/machinat/machinat/tree/master/packages/webview), serve webviews with authorization integrated with chat platforms. And communicate to server with [WebSocket](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API).

## Enabling JSX

To enable Machinat JSX syntax, you need to configure the transpiling
environment first. Then import `Machinat` at the beginning of file to make
JSX syntax works like this:

```js
import Machinat from '@machinat/core';

const greeting = <p>Hello World!</p>;
```

You can choose tranpiling your codes with either [Babel.js](https://babeljs.io/)
or [TypeScript](https://www.typescriptlang.org/).

### With Babel

First install babel and `@machinat/babel-preset` package with command:

```bash
npm install -D @babel/core @babel/cli @babel/preset-env @machinat/babel-preset
# or using yarn
yarn add --dev @babel/core @babel/cli @babel/preset-env @machinat/babel-preset
```

Then add this into `babel.config.js`:

```js
module.exports = {
  presets: [
    ['@babel/preset-env', {
        targets: {
          node: '12', // choose your preferred node version here
        },
    }],
    '@machinat/babel-preset',
  ],
};
```

### With TypeScript

Add the following `compilerOptions` settings in your `tsconfig.json`:

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

The `@machinat/http` module provide underlying utilities for platforms need
receiving HTTP request. When `app.start()`, a HTTP server will be created and
start listening for requests.

You can use `listenOptions` to configure options for [`server.listen()`](https://nodejs.org/dist/latest/docs/api/net.html#net_server_listen_options_callback) like this:

```js
Http.initModule({
  listenOptions: {
    host: '::',
    port: 8080,
    ipv6Only: true,
  },  
})
```

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
