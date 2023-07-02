---
title: Getting Started
slug: /
---

Welcome to the Sociably framework document!

If you are new to Sociably, we recommend starting from [the tutorial](/docs/learn).
It brings you to build a complete app step by step.

## System Requirement

- [Node.js](https://nodejs.org/) 10.13 or later

## Create Sociably App

We recommend to create a Sociably app project with `@sociably/create-app`
initiator. Run this command to create a hello-world project:

```bash
npm init @sociably/app@latest -- -p <platform> [-p <platform> ...] <project-path>
```

Or using `yarn`:

```bash
yarn create @sociably/app -p <platform> [-p <platform> ...] <project-path>
```

### Platforms

The following platforms are supported for now:

- `facebook` - receive/send messages as a Facebook page in [Facebook Messenger](https://www.messenger.com).
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
import { serviceContainer } from '@sociably/core';
import Facebook from '@sociably/facebook';

export const up = serviceContainer({
  deps: [Facebook.Bot],
})(
  async (facebookBot) => {
    // create resources...
    facebookBot.requestApi(/* ... */);
  }
);

export const down = serviceContainer({
  deps: [Facebook.Bot],
})(
  async (facebookBot) => {
    // remove resources...
    facebookBot.requestApi(/* ... */);
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
If your app supports Facebook platform,
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

Sociably framework is built in progressive framework paradigm,
that you can install the modules you need progressively.
First you need `@sociably/core` and also `@sociably/http` to receive HTTP requests:

```bash
npm install @sociably/core @sociably/http
# or with yarn
yarn add @sociably/core @sociably/http
```

A simple Sociably app may look like this:

```js
import Sociably from '@sociably/core';
import Http from '@sociably/http';
import Facebook from '@sociably/facebook';

const ENV = process.env;

Sociably.createApp({
  modules: [
    Http.initModule({ port: 8080 }),
  ],
  platforms: [
    Facebook.initModule({
      webhookPath: '/webhook/facebook',
      pageId: ENV.FACEBOOK_PAGE_ID,
      accessToken: ENV.FACEBOOK_ACCESS_TOKEN,
      appSecret: ENV.FACEBOOK_APP_SECRET,
      verifyToken: ENV.FACEBOOK_VERIFY_TOKEN,
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
npm install @sociably/facebook @sociably/webview # ...
# or with yarn
yarn add @sociably/facebook @sociably/webview # ...
```

For now, Sociably supports the platforms below. Check the readme of the package for the usage guide.

- [`@sociably/facebook`](https://github.com/machinat/sociably/tree/master/packages/facebook) - receive/send messages as a Facebook page in [Facebook Messenger](https://www.messenger.com).
- [`@sociably/telegram`](https://github.com/machinat/sociably/tree/master/packages/telegram) - receive/send messages as a Telegram bot.
- [`@sociably/line`](https://github.com/machinat/sociably/tree/master/packages/line) - receive/send messages as a [LINE](https://line.me) official account.
- [`@sociably/webview`](https://github.com/machinat/sociably/tree/master/packages/webview) - extend embedded webviews on the chat platforms.

## Enabling JSX

To enable Sociably JSX syntax, you need to configure the transpiling environment.
You can choose either [Babel.js](https://babeljs.io/) or [TypeScript](https://www.typescriptlang.org/).

Add the following `compilerOptions` settings in your `tsconfig.json`:

```js
{
  "compilerOptions": {
    "jsx": "react",
    "jsxFactory": "Sociably.createElement",
    "jsxFragmentFactory": "Sociably.Fragment"
    // ...
  }
}
```

### Import `Sociably`

Finally you have to import `Sociably` in the file before using JSX:

```js
import Sociably from '@sociably/core';

const greeting = <p>Hello World!</p>;
```

:::info
In `TypeScript`, the file extension must be `.tsx` to enable JSX syntax.
:::

## Listening to HTTP

Use `listenOptions` of the `@sociably/http` module to configure HTTP server.
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
Sociably.createApp({
  platforms: [
    Facebook.initModule({
      webhookPath: '/webhook/facebook',
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
const app = Sociably.createApp({ ... });

app
  .start()
  .then(() => console.log('Your App is Started!'))
  .catch(err => console.error(err));
```
