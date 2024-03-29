---
title: Embedded Webview
---

:::info
This document assumes you know the basic usage of _Next.js_ and _React.js_.
You can learn more about them here:

- [React.js](https://reactjs.org/docs/getting-started.html) - A JavaScript library for building user interfaces.
- [Next.js](https://nextjs.org/docs/getting-started) - The React Framework for Production.
:::

Chat UI brings a new way to communicate with users,
but it cannot totally replace GUI.
For the features that require precise control, instant interactions and richer displays, GUI is still a better choice.

The best practice we suggest is a hybrid experience that combines the advantages of both.
While a chatbot is easier to access,
we can extend a webview to ship more amazing features in GUI.

## Webview Platform

`@sociably/webview` platform serves embedded webviews in the chat.
It does these three things in the background:

1. Host a web app with [Next.js](https://nextjs.org).
2. Log in users with their chat platforms account.
3. Connect a [WebSocket](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API) to communicate with the server.

## Install With Creator

If you are creating a new project with our app creator,
add a `--webview` flag and everything will be set up.
Like this:

```bash
npm init @sociably/app@latest -- -p telegram --webview my-project
```

:::info
Check [Manually Install](#manually-install) section for step-by-step setup guide.
:::

## Open the Webview

The chat platforms may provide some special components to open the webview in the chatroom.
For example:

```js
import * as Facebook from '@sociably/facebook/components';
import { WebviewButton as FacebookWebviewButton } from '@sociably/facebook/webview';

<Facebook.ButtonTemplate
  buttons={
    // highlight-start
    <FacebookWebviewButton title="Open Webview ↗️" />
    // highlight-end
  }
>
  Hello World!
</Facebook.ButtonTemplate>
```

With the codes above, the webview will be opened in the Facebook Messenger app when the `WebviewButton` is tapped.
Check the document of each platform for the details.

- [Facebook](./facebook-platform#open-the-webview)
- [Twitter](./twitter-platform#open-the-webview)
- [Telegram](./telegram-platform#open-the-webview)
- [LINE](./line-platform#open-the-webview)

### Determine the `platform`

Sometimes you might want to decide which platform to log in,
for example, when a user opens the web page in the browser directly.
It's determined in this order:

1. The `platform` option while constructing `WebviewClient`. For example:

```js
const client = new WebviewClient({
  platform: 'line',
  // ...
});
```

2. The `platform` querystring param on the URL. Like:

```
https://my.sociably.app/webview?platform=facebook
```

3. The platform that already logged in.

Notice that some platforms only support opening webviews from the chatroom,
like Facebook.

## Webview Client

In the front-end, the `WebviewClient` handles the login flow and the communication to the server.
It can be constructed like this:

```js
import WebviewClient from '@sociably/webview/client';
import FacebookAuth from '@sociably/facebook/webview/client';

const client = new WebviewClient({
  authPlatforms: [FacebookAuth],
});
```

You have to add the chat platforms to log in with at `authPlatforms`.
The client will sign in the user and connect to the server after constructed.

### `useClient` Hook

If you are using React.js in front-end,
use the `useClient` hook to create a client in the lifetime of a component.
Like this:

```jsx
import { useClient } from '@sociably/webview/client';
import FacebookAuth from '@sociably/facebook/webview/client';

export default function MyApp() {
  const client = useClient({
    authPlatforms: [FacebookAuth],
  });

  const sayHello = () => {
    client.send({ type: 'hello', payload: 'world' });
  };

  return (
    <div>
      <h1>Hello World</h1>
      <button onClick={sayHello}>hello</button>
    </div>
  );
}
```

### Receive Events from Server

On the client-side, you can use `client.onEvent(listener)` to subscribe events from the server.
Like this:

```js
client.onEvent(({ event }) => {
  if (event.type === 'connect') {
    // handle connect
  } else if (event.type === 'app_data') {
    // handle app data
  }
});
```

The listener receive an event context object with following info:

- `event` - `object`, event object.
  - `platform` - `'webview'`.
  - `category` - `string`, event category.
  - `type` - `string`, event type.
  - `user` - `object`, the logged-in user
  - `thread` - `object`, the connection to the server.

- `auth` - `object`, auth info.
  - `platform` - `string`, authenticating platform.
  - `user` - `object`, the logged-in user.
  - `thread` - `object`, the chat where the user comes from.
  - `loginAt` - `Date`, the logged-in time.
  - `expireAt` - `Date`, the time when authorization expires.
  - `data` - `any`, raw auth data from chat platform.

- `authenticator` - `object`, the authenticator instance of the authenticated platform.

### `connect` and `disconnect`

Two system events will be received when the connection status is changed:

- `connect` - received when the connection is connected.
  - `category` - `'connection'`.
  - `type` - `'connect'`.
  - `payload` - `null`.

- `disconnect` - received when the connection is disconnected.
  - `category` - `'connection'`.
  - `type` - `'disconnect'`.
  - `payload` - `object`.
    - `reason` - `undefined | string`, reason for disconnect.


### Send Event on Client-Side

Use `client.send(eventObj)` method to send an event to the server.
For example:

```js    
client.send({
  type: 'greeting',
  payload : '👋',
});
```

The `eventObj` take these properties:

- `category` - optional, `string`, set to `'default'` if not specified.
- `type` - required, `string`, the event type.
- `payload` - optional, `any`, the value will be serialized and sent to the server.

You don't have to wait for `'connect'` to send events.
The events sent before it are queued and delivered after it's connected.

### `useEventReducer` Hook

`useEventReducer` hook provides a convenient way to handle events in a React component (e.g. a Next.js page).
For example, an app can display data from the server like this:

```js
import WebviewClient, { useEventReducer } from '@sociably/webview/client';
// ...

export default function Home() {
  const { color, content } = useEventReducer(
    client,
    (data, { event }) => {
      if (event.type === 'app_data') {
        return event.payload;
      }
      if (event.type === 'color_updated') {
        return { ...data, color: event.payload.color };
      }
      return data;
    },
    { color: '#000', content: 'loading...' }
  );

  return (
    <main>
      <input
        type="color"
        value={color}
        onChange={(e) =>
          client.send({
            type: 'update_color',
            payload: { color: e.target.value },
          })
        }
      />
      <div style={{ textColor: color }}>Content: {content}</div>
    </main>
  );
}
```

`useEventReducer(client, reducer, initialState)` takes a reducer function of type `(state, eventContext) => newState`.
Everytime an event is received, the reducer is called to update the new state.
It's useful to maintain the _real-time_ app data.

## Webview Platform

On the server side, the `@sociably/webview` platform need to be registered in your app.
Like this:

```js
import Sociably from '@sociably/core';
import Http from '@sociably/http';
import Webview from '@sociably/webview';
import TelegramAuth from '@sociably/telegram/webview';
import nextConfig from '../webview/next.config.js';

const app = Sociably.createApp({
  modules: [
    Http.initModule({/* ... */}),
  ],
  platforms: [
    Webview.initModule({
      webviewHost: 'your.domain.com',
      authSecret: '_secret_string_to_sign_token_',
      authPlatforms: [TelegramAuth],
      nextServerOptions: {
        dev: process.env.NODE_ENV !== 'production',
        dir: `./webview`,
        conf: nextConfig,
      },
    }),
  ],
});
```

The `authPlatforms` should correspond to the client settings.
Add the auth providers from all the platforms that requires webviews.
More options can be found [here](pathname:///api/modules/webview.html#webviewconfigs).

### Receive Events from Clients

On the server-side, events from the client are received as ordinary event context.
For example:

```js
app.onEvent(async ({ platform, event, bot }) => {
  if (platform === 'webview') {
    if (event.type === 'connect') {
      const { color } = await getUserState(event.user);

      return bot.send(event.thread, {
        type: 'app_data',
        payload : { color, content: 'Hello Webview' },
      });
    }
    
    if (event.type === 'update_color') {
      await updateUserState(event.user, event.payload.color);

      return bot.send(event.thread, {
        type: 'color_updated',
        payload: { color: event.payload },
      });
    }
  }
});
```

The webview event context contains the following info:

- `platform` - `'webview'`.

- `bot` - `object`, the webview bot.

- `event` - `object`, event object.
  - `platform` - `'webview'`.
  - `category` - `string`, event category.
  - `type` - `string`, event type.
  - `user` - `object`, the logged-in user.
  - `thread` - `object`, the connection to the client.

- `metadata` - `object`, meta info about the connection.
  - `source` - `'websocket'`.
  - `request` - `object`, http upgrade request info.
  - `connection` - `object`, identical to `event.thread`.
  - `auth` - `object`, auth info, identical to `context.auth` in client-side.
    - `platform` - `string`, authenticating platform.
    - `user` - `object`, the logged-in user.
    - `thread` - `object`, the chat where the user comes from.
    - `loginAt` - `Date`, the logged-in time.
    - `expireAt` - `Date`, the time when authorization expires.
    - `data` - `any`, raw auth data from chat platform.
 
The `'connect'` and `'disconnect'` events are emitted on server-side too when the status of a connection has changed.

### Send Event to the Client

`bot.send(connection, eventObj)` method sends an event back to the client.
It takes the same event object as `client.send(eventObj)`.

```js
await bot.send(event.thread, {
  category: 'event_category',
  type: 'event_type',
  payload: { some: 'serializable content' }
});
```

Note that the sending promise sometimes resolves even if the delivery fails (e.g. client is offline).
You can tell whether it succeed like this:

```js
const result = await bot.send(event.thread, {
  type: 'foo',
  payload: 'bar',
});
if (result.connections.length === 0) {
  console.log('sending is not completed');
}
```

### Broadcast by a Topic

In some cases you might need to broadcast an event to many connections.
For example, to make a multi-players game.

A connection can subscribe to a topic with `bot.subscribeTopic`.
Like:

```js
await bot.subscribeTopic(event.thread, 'topicName');
```

Then you can send events to all the connections that subscribe to a topic with `bot.sendTopic`.
Like:

```js
const result = await bot.sendTopic('topicName', {
  type: 'game_start',
  payload: { game: 'data' },
});
```

To put them together, this example let users say hello on a global topic:

```js
app.onEvent(async ({ event, bot }) => {  
  if (event.type === 'connect') {
    return bot.subscribeTopic(event.thread, 'world');
  }
  
  if (event.type === 'hello') {
    const result = await bot.sendTopic('world', {
      type: 'hello',
      payload: event.payload,
    });

    console.log(`hello to ${result.connections.length} connections`);
  }
});
```

To unsubscribe a topic, use `bot.unsubscribeTopic` like:

```js
await bot.unsubscribeTopic(event.thread, 'topicName');
```

### Interact With Chat

`metadata.auth.thread` refers to the chatroom where the user comes from.
You can use it to provide features that extend the chatting experience.

With webviews, the bot can ship any features you can do in a web app.
One common usage is filling complicated input in the webview,
like selecting a location on the map.

#### Send Messages to Chat

To send messages back to the original chatroom,
you can use `BaseBot` service like:

```js
import Sociably, { BaseBot } from '@sociably/core';

app.onEvent(
  serviceContainer({ deps: [BaseBot] })(
    (basicBot) =>
    async ({ platform, metadata, event }) => {
      if (platform === 'webview' && event.type === 'connect') {
        await basicBot.render(
          metadata.auth.thread,
          <p>I see you on the webview!</p>
        );
      }
    }
  )
);
```

## Manually Install

First install the following packages:

```bash
npm install react react-dom next @sociably/webview
```

### Create Web App

Next you need a Next.js app to host the webview.
You can create one with:

```bash
npx create-next-app@latest webview
```

Check [Next.js document](https://nextjs.org/docs/getting-started) for more details.

### Server-Side Setup

Then register the `@sociably/webview` platform to your app like this:

```js
// src/app.js
import Sociably from '@sociably/core';
import Http from '@sociably/http';
import Webview from '@sociably/webview';
import Telegram from '@sociably/telegram';
import TelegramAuth from '@sociably/telegram/webview';
import nextConfig from '../webview/next.config.js';

const app = Sociably.createApp({
  modules: [
    // http module must be installed
    Http.initModule({
      listenOptions: { port: 8080 },
    }),
  ],
  platforms: [
    Webview.initModule({
      // hostname of your server
      webviewHost: 'xxx.sociably.io',
      // secret string for siging auth token
      authSecret: '_some_secret_string_',
      // authenticators from chat platforms
      authPlatforms: [
        TelegramAuth,
      ],
      // Next.js server options
      nextServerOptions: {
        // to start server in dev mode or not
        dev: process.env.NODE_ENV !== 'production',
        // Next.js directory from project root
        dir: `./webview`,
        // require configs from next.config.js
        conf: nextConfig,
      },
    }),
    Telegram.initModule({/* ... */}),
  ],
});
```

The webview page should be available at `/` of your server now.
You can check more platform options [here](pathname:///api/modules/webview.html#webviewconfigs).

### `authPlatforms` on Server

To integrate with the chatroom,
you have to add the supported `authPlatforms` to log in users.
Conventionally, the providers are available at `@sociably/<platform>/webview`.

```js
import FacebookAuth from '@sociably/facebook/webview';
import TelegramAuth from '@sociably/telegram/webview';
import LineAuth from '@sociably/line/webview';
// ...
  Webview.initModule({
    authPlatforms: [
      FacebookAuth,
      TelegramAuth,
      LineAuth,
    ],
    // ...
  }),
```

### Client-Side Setup

At the client-side,
we can connect to the server using `WebviewClient`.
For example:

```js
// webview/pages/index.js
import WebviewClient from '@sociably/webview/client';
import TelegramAuth from '@sociably/telegram/webview/client';

const client = new WebviewClient({
  // prevent connections while rendering on server-side
  mockupMode: typeof window === 'undefined',
  // authenticators from chat platforms
  authPlatforms: [
    new TelegramAuth(),
  ],
});

client.onError(console.error);
```

After the `client` is constructed, it'll do these two thing automatically:

1. Log in user to the selected chat platform .
2. Opens a `WebSocket` connection to the server.

You can check more client options [here](pathname:///api/modules/webview_client.html#clientoptions).

### `authPlatforms` on Client

The supported `authPlatforms` also need to be added at the client.
Check the guide of each platform for the details.

- [Facebook](./facebook-platform#auth-setup)
- [Twitter](./twitter-platform#auth-setup)
- [Telegram](./telegram-platform#auth-setup)
- [LINE](./line-platform#auth-setup)

### Get Settings from Server

If an authenticator require settings from server-side,
use [`publicRuntimeConfig`](https://nextjs.org/docs/api-reference/next.config.js/runtime-configuration) to pass it to the client.
For example:

```js
import FacebookAuth from '@sociably/facebook/webview/client';

// to activate publicRuntimeConfig
export const getServerSideProps = () => ({ props: {} });
// get runtime settings
const { publicRuntimeConfig } = getConfig();

const client = new WebviewClient({
  authPlatforms: [
    new FacebookAuth({
      appId: publicRuntimeConfig.facebookAppId,
    }),
  ],
});
```

Then add the setting in `next.config.js` like this:

```js
module.exports = {
  publicRuntimeConfig: {
    facebookAppId: process.env.FACEBOOK_APP_ID,
  },
};
```
