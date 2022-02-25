---
title: Getting Started
slug: /
---

Welcome to the Machinat framework document!

If you are new to Machinat, we recommend starting from [the tutorial](/docs/learn).
It brings you to build a complete app step by step.

## System Requirement

- [Node.js](https://nodejs.org/) 10.13 or later

## Create Machinat App

We recommend to create a Machinat app project with `@machinat/create-app`
initiator. Run this command to create a hello-world project:

```bash
npm init @machinat/app@latest -- -p <platform> [-p <platform> ...] <project-path>
```

Or using `yarn`:

```bash
yarn create @machinat/app -p <platform> [-p <platform> ...] <project-path>
```

### Platforms

The following platforms are supported for now:

- `messenger` - receive/send messages as a Facebook page in [Messenger](https://www.messenger.com).
- `telegram` - receive/send messages as a bot in [Telegram](https://telegram.org).
- `line` - receive/send messages as a [LINE](https://line.me) official account.
- `webview` - extend embedded webviews on the chat platforms.

### Project Directory Structure

After the command is finished, it create the new project with following structure:

```
.
├── src
│   ├── cli                     # executable bin
│   │   └── ...
│   ├── components              # chat UI components
│   │   └── ...
│   ├── handlers                # event handlers
│   │   ├── handleChat.tsx      # handle chat events
│   │   ├── handleWebview.tsx   # handle webview events
│   │   └── ...
│   ├── scenes                  # dialog scripts
│   │   └── ...
│   ├── services                # common services
│   │   ├── useIntent.ts        # detect intent
│   │   ├── useUserProfile.ts   # get user profile
│   │   └── ...
│   ├── migrations              # migrations
│   │   ├── 0-init-app.ts       # initial migration
│   │   └── ...
│   ├── webview                 # webview front-end
│   │   ├── pages
│   │   │   └── index.tsx       # root webview page
│   │   ├── next.config.js      # next.js config
│   │   └── ...
│   ├── main.ts                 # control flow of events
│   ├── app.ts                  # init platforms, modules and services
│   ├── recognitionData.ts      # intent recognition data
│   └── index.ts                # entry point to start server
├── package.json
├── package-lock.json
├── tsconfig.json
├── .env                        # environments file
└── .env.example
```


### Env Configs

The `.env` file contains settings that need to be filled before starting your app.
You can check `.env.example` for the instructions to set up.

### Migrations

To run the app on the chat platforms,
you need to manage resources like the webhook subscriptions.
The managing operations are described in migration files under `/src/migrations`.

A migration file might looks like this:

```js
import { makeContainer } from '@machinat/core';
import Messenger from '@machinat/messenger';

export const up = makeContainer({
  deps: [Messenger.Bot],
})(
  async (messengerBot) => {
    // create resources...
    messengerBot.makeApiCall(/* ... */);
  }
);

export const down = makeContainer({
  deps: [Messenger.Bot],
})(
  async (messengerBot) => {
    // remove resources...
    messengerBot.makeApiCall(/* ... */);
  }
);
```

Every time you develop or deploy on a new environment,
run command `npm run migrate` to update the migration jobs.
It executes the `up` function to keep the resources up to date.

Every migration job is going to be executed once per environment.
You can also use the `npm run migrate -- --down` command to revert the migrations.
It executes the `down` function to cancel the operations.

The `/src/migrations/0-init-app.ts` file contains the initiating jobs.
You can add new operations in it before the app goes into production.
After that, consider adding a new migration file so you can rollback if needed.

:::info
If your app supports Messenger platform,
make sure the server is running while executing the initial migration.
:::

### Start Dev Server

During development, use the `npm run dev` command to start the server in dev mode.
The command do 2 things:

1. Start a dev server up. It'll automatically refresh when codes change.
2. Create a https tunnel connected to a _https://xxx.t.machinat.dev_ endpoint,
   so your local server can receive webhook requests from the chat platforms.

Try talking to your bot on the chat platform when the server is running.
A hello-world app should be working if you finish the setup.

## Manually Install

:::tip
The rest of this page is for creating your project from scratch.
You can skip if you choose to use the creator.
:::

### Core Modules

Machinat framework is built in progressive framework paradigm,
that you can install the modules you need progressively.
First you need `@machinat/core` and also `@machinat/http` to receive HTTP requests:

```bash
npm install @machinat/core @machinat/http
# or with yarn
yarn add @machinat/core @machinat/http
```

A simple Machinat app may look like this:

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
  .onEvent(async ({ reply, event }) => {
    await reply(<p>Hello World!</p>);
  })
  .start();
```

### Platforms

Platforms modules connect to external sources,
like messaging platforms, webviews or any communication channel.
The platforms listen to events from users and interact with them.
That's how a _sociable app_ works.

Install the platform packages that you like to communicate your users with:

```bash
npm install @machinat/messenger @machinat/webview # ...
# or with yarn
yarn add @machinat/messenger @machinat/webview # ...
```

For now, Machinat supports the platforms below. Check the readme of the package for the usage guide.

- [`@machinat/messenger`](https://github.com/machinat/machinat/tree/master/packages/messenger) - receive/send messages as a Facebook page in [Messenger](https://www.messenger.com).
- [`@machinat/telegram`](https://github.com/machinat/machinat/tree/master/packages/telegram) - receive/send messages as a Telegram bot.
- [`@machinat/line`](https://github.com/machinat/machinat/tree/master/packages/line) - receive/send messages as a [LINE](https://line.me) official account.
- [`@machinat/webview`](https://github.com/machinat/machinat/tree/master/packages/webview) - extend embedded webviews on the chat platforms.

## Enabling JSX

To enable Machinat JSX syntax, you need to configure the transpiling environment.
You can choose either [Babel.js](https://babeljs.io/) or [TypeScript](https://www.typescriptlang.org/).

### With TypeScript

Add the following `compilerOptions` settings in your `tsconfig.json`:

```js
{
  "compilerOptions": {
    "jsx": "react",
    "jsxFactory": "Machinat.createElement",
    "jsxFragmentFactory": "Machinat.Fragment"
    // ...
  }
}
```

### With Babel

Install `@machinat/babel-preset` package:

```bash
npm install -D @machinat/babel-preset
# or using yarn
yarn add --dev @machinat/babel-preset
```

Then add it into `babel.config.js` like this:

```js
module.exports = {
  presets: [
    ['@babel/preset-env', {
      //...
    }],
    '@machinat/babel-preset',
  ],
};
```

### Import `Machinat`

Finally you have to import `Machinat` in the file before using JSX:

```js
import Machinat from '@machinat/core';

const greeting = <p>Hello World!</p>;
```

:::info
In `TypeScript`, the file extension must be `.tsx` to enable JSX syntax.
:::

## Listening to HTTP

Use `listenOptions` of the `@machinat/http` module to configure HTTP server.
It take the same options as [`server.listen()`](https://nodejs.org/dist/latest/docs/api/net.html#net_server_listen_options_callback).
For example:

```js
Http.initModule({
  listenOptions: {
    host: '::',
    port: 8080,
    ipv6Only: true,
  },  
})
```

If you have multiple platforms that need a HTTP entry point,
set the route path for each platform. Like:


```js
Machinat.createApp({
  platforms: [
    Messenger.initModule({
      webhookPath: '/webhook/messenger',
      //...
    }),
    Telegram.initModule({
      webhookPath: '/webhook/telegram',
      //...
    }),
  ],
  //...
})
```

You can check the [API reference](pathname:///api) for the details.

## Starting App

After all modules are configured, call `app.start()` to run the app. Like:

```js
const app = Machinat.createApp({ ... });

app
  .start()
  .then(() => console.log('Your App is Started!'))
  .catch(err => console.error(err));
```
