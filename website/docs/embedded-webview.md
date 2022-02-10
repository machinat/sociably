---
title: Embedded Webview
---

:::info
This document assumes you know basic usage about Next.js and React.js.
You can learn more about them here:

- [React.js](https://reactjs.org/docs/getting-started.html) - A JavaScript library for building user interfaces.
- [Next.js](https://nextjs.org/docs/getting-started) - The React Framework for Production.
:::

Chat UI brings us a new way to communicate with users,
but it cannot totally replace GUI.
GUI still performs better

which provides more features with precise control, instant interactions and richer displays.

The best practice we suggest is a hybrid experience that combines the advantage of both CUI and GUI. While chatbot, as the entry point of the app, is easier to access, the webview can provide more advanced and complex features.

## Webview Platform

`@machinat/webview` package serves webviews which are integrated with the chat platforms. It does these three things in the background:

1. Host the webview front-end app with [Next.js](https://nextjs.org).
2. Authorize users with their chat platforms account.
3. Connect a [WebSocket](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API) to instantly communicate with server.

### Install With Creator

Starting with our project creator is the recommended if you are creating a whole new project. You only have to add a `-p webview` flag, and everything will be set. Like:

```bash
npm init @machinat/app@latest -- -p messenger -p webview my-project
```

### Install Manually

Install the following packages with npm:

```bash
npm install react react-dom next @machinat/webview
```

Or using yarn:

```bash
yarn add react react-dom next @machinat/webview
```

### Back-End Setup

Register the `@machinat/webview` platform to your app like this:

```js
// src/app.js
import Machinat from '@machinat/core';
import Http from '@machinat/http';
import Webview from '@machinat/webview';
import Messenger from '@machinat/messenger';
import MessengerWebviewAuth from '@machinat/messenger/webview';
import Telegram from '@machinat/telegram';
import TelegramWebviewAuth from '@machinat/telegram/webview';
import nextConfig from '../webview/next.config.js';

const app = Machinat.createApp({
  modules: [
    // `Http` module have to be installed
    Http.initModule({
      listenOptions: { port: 8080 },
    }),
  ],
  platforms: [
    Webview.initModule({
      // hostname of your server
      webviewHost: 'www.machinat.com',
      // secret string for siging auth token
      authSecret: '_some_secret_string_',
      // auth providers from the chat platforms
      authPlatforms: [
        MessengerWebviewAuth,
        TelegramWebviewAuth,
      ],
      // Next.js server options
      nextServerOptions: {
        // to start server in dev mode or not
        dev: process.env.NODE_ENV !== 'production',
        // Next.js app path from project root
        dir: `./webview`,
        // require configs from next.config.js
        conf: nextConfig,
      },
    }),
    Messenger.initModule({/* ... */}),
    Telegram.initModule({/* ... */}),
  ],
});
```

The webview page should be available at `/` of your server now. You can check more webview options [here](pathname:///api/modules/webview.html#webviewconfigs).

### Front-End Setup

While the webview platform are ready in the back-end, we can connect to server with `WebviewClient` in the front-end. Add these codes in the webview page:

```js
// webview/pages/index.js
import getConfig from 'next/config';
import WebviewClient from '@machinat/webview/client';
import MessengerWebviewAuth from '@machinat/messenger/webview/client';
import TelegramWebviewAuth from '@machinat/telegram/webview/client';

// to activate publicRuntimeConfig
export const getServerSideProps = () => ({ props: {} });
// get runtime settings if needed
const { publicRuntimeConfig } = getConfig();
 
const client = new WebviewClient({
  // prevent any connection while server rendering on server-side
  mockupMode: typeof window === 'undefined',
  // auth providers from the chat platforms
  authPlatforms: [
    new MessengerWebviewAuth({
      appId: publicRuntimeConfig.messengerAppId,
    }),
    new TelegramWebviewAuth(),
  ],
  // optionally specify the platform to login
  // platform: 'messenger',
});

client.onError(console.error);
```

If an auth platfrom require settings from back-end, use [`publicRuntimeConfig`](https://nextjs.org/docs/api-reference/next.config.js/runtime-configuration) features of next.js. The `next.config.js` might look like this:

```js
module.exports = {
  publicRuntimeConfig: {
    messengerAppId: process.env.MESSENGER_APP_ID,
  },
};
```

`WebviewClient` will automatically log in user to the chat platform after constructed, and then it opens a `WebSocket` connection to communicate with server. You can check more client options [here](pathname:///api/modules/webview_client.html#clientoptions).

## Open Webview

Different platforms could need different procedures to open a webview. For example in Messenger, it require a `UrlButton` with `messengerExtensions` prop:

```js
<Messenger.ButtonTemplate
  buttons={
    <Messenger.UrlButton
      title="Open Webview ↗️"
      url={`https://${serverDomain}?platform=messenger`}
      messengerExtensions
    />
  }
>
  Hello World!
</Messenger.ButtonTemplate>
```

With the codes above, the webview will be opened in Messenger app after the `UrlButton` is tapped. Please check the document of each platform for more details.

### The `platform` Query Param

If you didn't specify `platform` option while constructing `WebviewClient`, the platform to login will be determined by the `platform` querystring param. For example, client will try login user to Messenger on this URL:

```
https://machinat.app/webview?platform=messenger
```

Login process would fail if neither the `platfrom` option nor querystring is set.

## Communication on Client

After successfully log in the user, the webview and the server can communicate through a `WebSocket` connection. So you can easily display **real-time** data in the webview.

### Receiving Event

On client-side, use `client.onEvent(listener)` to subscribe events from server. Like this:

```js
client.onEvent(({ event }) => {
  if (event.type === 'connect') {
    client.send({
      type: 'greeting',
      payload : '👋',
    });
  }
});
```

The listener callback function receive an event context object with following info:

- event - `object`, event object.
  - platform - `'webview'`.
  - category - `string`, event category.
  - type - `string`, event type.
  - user - `object`, the same as `auth.user`.
  - channel - `object`, represent the WebSocket connection.
- auth - `object`, auth info of the user.
  - platform - `string`, authorizing chat platform.
  - user - `object`, the user logged in.
  - channel - `null | object`, the chat where the user comes from. It could be `null` if not able to determine.
  - loginAt - `Date`, the time user logged in.
  - expireAt - `Date`, the time when current authorization expires.
  - data - `any`, raw auth data from chat platform.
- authenticator - `object`, the authenticator instance of the authorizing platform.

### `connect` and `disconnect`

Two system events will be received when connection status changes:

- connect - received when a connection is authorized and connected.
  - category - `'connection'`.
  - type - `'connect'`.
  - payload - `null`.
- disconnect - received when a connection is disconnected.
  - category - `'connection'`.
  - type - `'disconnect'`.
  - payload - `object`.
    - reason - `undefined | string`, disconnect reason.


### Send Event on Client-Side

Use `client.send(eventObj)` method to send event to the server. The following properties can be set:

- category - optional, `string`, set to `'default'` if not specified.
- type - required, `string`, the event type.
- payload - optional, `any`, the value will be serialized and sent to server.

You don't have to wait for `'connect'` event to send events. Any event sent before connection is opened would be queued, and will be delivered after connected.

### `useEventReducer` Hook

To use client in a React component (e.g. a Next.js page), one convenient way is using the `useEventReducer` hook. For example, an app can display data from the server like this:

```js
import WebviewClient, { useEventReducer } from '@machinat/webview/client';

// ...

export default function Home() {
  const { color, content } = useEventReducer(
    client,
    (data, { event }) =>
      event.type === 'app_data'
        ? event.payload
        : event.type === 'color_updated'
        ? { ...data, color: event.payload }
        : data
    },
    { color: '#000', content: 'loading...' }
  );
  
  function handleColorChange(e) {
    client.send({
      type: 'update_color',
      payload: e.target.value,
    });
  }

  return (
    <main>
      <input type="color" value={color} onChange={handleColorChange} />
      <div style={{ textColor: color }}>Content: {content}</div>
    </main>
  );
}
```

`useEventReducer(client, reducer, initialState)` take a reducer function of type `(state, eventContext) => newState`. Every time a event from server is received, the reducer function is called to get the new state. It's useful to maintain real-time data synchronized with server.

## Communication on Server

### Receiving Events

On the server-side, events from client are received just like events from chat platforms. Here's the server-side codes that respond the previous client example:

```js
app.onEvent(async ({ platform, event, metadata, bot }) => {
  if (platform === 'webview') {
    if (event.type === 'connect') {
      const { color, content } = await getUserState(metadata.auth.user);

      return bot.send(event.channel, {
        type: 'app_data',
        payload : { color, content },
      });
    }
    
    if (event.type === 'update_color') {
      await updateUserState(metadata.auth.user, event.payload);

      return bot.send(event.channel, {
        type: 'color_updated',
        payload: event.payload,
      });
    }
  }
});
```

The event handler receives an event context with the following properties:

- platform - `'webview'`.
- bot - the webview bot.
- event - `object`, the same as `event` in the client-side context.
- metadata - `object`, meta info about the connection.
  - source - `'websocket'`.
  - request - `object`, http upgrade request info.
  - auth - `object`, the same as `auth` in the client-side context.
  - connection - `object`, the same as `event.channel`.

The `connect` and `disconnect` events are emitted on server-side too when the status of a connection has changed.

### Send Event to a Client

The `event.channel` of the context refers to the connection with the client. You can use `bot.send(conn, eventObj)` method sends event back to the client. The `category`, `type` and `payload` can be set like `client.send(eventObj)`.

```js
await bot.send(event.channel, {
  category: 'event_category',
  type: 'event_type',
  payload: { some: 'serializable content' }
});
```

Note that the sending promise could resolve even if the delivery fail (e.g. client offline). You can tell whether it succeed like this:

```js
const result = await bot.send(event.channel, {
  type: 'foo',
  payload: 'bar',
});
if (result.connections.length === 0) {
  console.log('sending is not completed');
}
```

### Broadcast by a Topic

In some case you might need to broadcast an event to many connections, for example, to make a multi-players game. To achieve this, register a subscription to a topic like:

```js
await bot.subscribeTopic(event.channel, 'topicName');
```

Then send a event to all the connection that subscribe to the topic like:

```js
const result = await bot.sendTopic('topicName', {
  type: 'game_start',
  payload: { game: 'data' },
});
```

To put them together, the following example allow users to say hello to everyone on a global topic:

```js
app.onEvent(async ({ event, bot }) => {  
  if (event.type === 'connect') {
    return bot.subscribeTopic(event.channel, 'world');
  }
  
  if (event.type === 'hello') {
    const result = await bot.sendTopic('world', {
      type: 'hello',
      payload: event.payload,
    });

    console.log(`sent to ${result.connections.length} connection`);
  }
});
```

The subscription to a topic can be unsubscribed with:

```js
await bot.unsubscribeTopic(event.channel, 'topicName');
```

### Broadcast to an User

```js
const result = await bot.sendUser(user, eventObj);
```

Since an user can opens many webviews at the same time, you might want to keep all the webviews consistent. Use `sendUser` method to send an event to all the clients that logged in as the same user.

```js
app.onEvent(async context => {
  const { event, bot } = context;

  if (event.type === 'new_todo') {
    const result = await bot.sendUser(event.user, {
      type: 'todo_added',
      payload: event.payload,
    });

    console.log(`sent to ${result.connections.length} connection`);
  }
});
```

### Interact With Chat

The webview can integrate with chatroom to provide a hybrid experience in both GUI and chat UI. The `metadata.auth.channel` refer to the original chat where the user comes from. It can be used to send messages in the original chatroom like:

```js
import Machinat, { BasicBot } from '@machinat/core';

app.onEvent(
  makeContainer({ deps: [BasicBot] })(
    (baseBot) =>
      async ({ platform, metadata, event }) => {
        if (platform === 'webview' && event.type === 'connect') {
          await baseBot.render(
            metadata.auth.channel,
            <p>I see you on the webview!</p>
          );
        }
      }
  )
);
```

One common usage is enabling users to fill complex input in the webview, like selecting a location on the map. Actually this empower your chatbot to provide any features that a web app can do.
