---
title: Integrate with Webview
---

:::info
This document assume you know basic usage about Next.js and React.js.
You can learn more about them here:

- [React.js](https://reactjs.org/docs/getting-started.html) - A JavaScript library for building user interfaces.
- [Next.js](https://nextjs.org/docs/getting-started) - The React Framework for Production.
:::

Chat UI brings us a new way to communicate with users, but it cannot replace GUI at all. GUI still performs better on features that require precise control, instant interactions or showing large data.

The best practice we suggest is a hybrid experience combining the advantage of both CUI and GUI. While chatbot, as the entry point of the app, is easier to use and broadcast. An webview can be used to provide more advanced and complicated features.

## Setup Webview

The `@machinat/webview` package combine these utilities to provide webviews integrated with chat platform:

1. A webview front-end server hosted with [Next.js](https://nextjs.org).
2. A auth server that authorize user with chat platforms account.
3. A [WebSocket](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API) server to communicate with front-end in two-way.

### Back-End Setup


First install `@machinat/webview` package, then we can register the webview platform to the app like this:

```js
import Machinat from '@machinat/core';
import Http from '@machinat/http';
import Webview from '@machinat/webview';
import Messenger from '@machinat/messenger';
import MessengerAuthorizer from '@machinat/messenger/webview';
import Telegram from '@machinat/telegram';
import TelegramAuthorizer from '@machinat/telegram/webview';
import nextConfig from '../webview/next.config.js';

const app = Machinat.createApp({
  modules: [
    Http.initModule({
      listenOptions: { port: 8080 },
    }),
  ],
  platforms: [
    Webview.initModule({
      webviewHost: 'www.machinat.com',
      authSecret: '_some_secret_string_',
      nextServerOptions: {
        dev: process.env.NODE_ENV !== 'production',
        dir: `./webview`,
        conf: nextConfig,
      },
    }),
    Messenger.initModule({...}),
    Telegram.initModule({...}),
  ],
  services: [
    { provide: Webview.AuthorizerList, withProvider: MessengerAuthorizer },
    { provide: Webview.AuthorizerList, withProvider: TelegramAuthorizer },
  ],
});
```

Here are the steps we do to run the webview up:

1. The `Http` module have to be installed.
2. Fill `webviewHost` with hostname of your server.
3. Fill `authSecret` for signing auth token.
4. `nextServerOptions.dev` indicate next.js to start server in dev mode or not. We can use `NODE_ENV` environment to decide that.
5. `nextServerOptions.dir` should point to the next.js project location from project root. You can use `npx create-next-app` to create one.
6. If you have `next.config.js` settings in your next.js project. You have to require it and fill it at `nextServerOptions.conf`.
7. Provide `Webview.AuthorizerList` with server authorizer providers of each chat platform.

The webview page should be available at `/` of your server now. You can check more webview options [here](pathname:///api/modules/webview.html#webviewconfigs).

### Front-End Setup

While the webview utilities are ready in the back-end, we can connect to server with `WebviewClient` in the front-end. Add these codes in the next.js page:

```js
import getConfig from 'next/config';
import WebviewClient from '@machinat/webview/client';
import { MessengerClientAuthorizer } from '@machinat/messenger/webview';
import { TelegramClientAuthorizer } from '@machinat/telegram/webview';

// to activate publicRuntimeConfig
export const getServerSideProps = () => ({ props: {} });

const { publicRuntimeConfig } = getConfig();
 
const client = new WebviewClient(
  typeof window === 'undefined'
    ? { mockupMode: true, authorizers: [] }
    : {
        authorizers: [
          new MessengerClientAuthorizer({
            appId: publicRuntimeConfig.messengerAppId,
          }),
          new TelegramClientAuthorizer(),
          new LineClientAuthorizer({
            liffId: publicRuntimeConfig.lineLiffId,
          }),
        ],
      }
);

client.onError(console.error);
```

Here are the steps to construct `WebviewClient` on front-end:

1. Fill `authorizers` with the client authorizers from all supported chat platforms.
2. If you need configs to construct client authorizers, use [`publicRuntimeConfig`](https://nextjs.org/docs/api-reference/next.config.js/runtime-configuration) features of next.js (need to export an empty `getServerSideProps`). The `next.config.js` might look like this:
```js
module.exports = {
  publicRuntimeConfig: {
    messengerAppId: process.env.MESSENGER_APP_ID,
  },
};
```
3. Turn on `mockupMode` during server rendering at server side. It stop the client form making any real connection.
4. Set the `platform` option if you want to specify the platform for authorization.

After being constructed, the `client` will: 1) log in user to the chosen chat platform and 2) create a `WebSocket` connection to communicate with server. You can check more client options [here](pathname:///api/modules/webview_client.html#clientoptions).

## Open Webview

Different platform might need different procedure to open a webview. For example
in Messenger, it need a `UrlButton` with `messengerExtensions` prop set to true:

```js
<Messenger.ButtonTemplate
  buttons={
    <Messenger.UrlButton
      title="Open Webview ↗️"
      url={`https://${domain}?platform=messenger`}
      messengerExtensions
    />
  }
>
  Hello World!
</Messenger.ButtonTemplate>
```

With the codes above, the webview will be opened in Messenger app after user tap the button in the message.
Please check the document of platform packages for more details. 

### The `platform` Query

If you didn't specify `platform` option of webview client, it will determine by the `platform` query param by default. For example, client will try login user to Messenger account for this URL:

```
https://machinat.app/webview?platform=messenger
```

If neither the `platfrom` option nor query param is set, an error will be thrown because of failing to recognize the current platform.


## Communication on Client

After successfully authorize the user and connect to server, webview can server can communicate with each other through a WebSocket.
This enable you to build graphical UI with **real-time** data easily.

### Receiving Event

On client-side, we can use `client.onEvent(listener)` to subscribe events from server like this:

```js
client.onEvent(({ event }) => {
  if (event.type === 'connect') {
    client.send({
      category: 'message',
      type: 'greeting',
      payload : '👋',
    });
  }
});
```

The listener callback function receive a event context object with following info:

- event - `object`, event object.
  - platform - `'webview'`.
  - category - `string`, event category.
  - type - `string`, event type.
  - user - `object`, the same as `auth.user`.
  - channel - `object`, represent the WebSocket connection.
- auth - `object`, auth info of the user.
  - platform - `string`, authorizing chat platform name.
  - user - `object`, the user from chat platform.
  - channel - `null | object`, the chat user comes from. The value could be `null` if not able to determine.
  - loginAt - `Date`, the time user logged in.
  - expireAt - `Date`, the time current authorization would expired.
  - data - `any`, raw auth data from chat platform.
- authorizer - `object`, the authorizer instance of the authorizing chat platform.

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

We can use `client.send(eventObj)` method to send event to server. The following event properties can be set:

- category - optional, `string`, set to `'default'` if not specified.
- type - required, `string`, the event type.
- payload - optional, `any`, the value will be serialized and sent to server.

You don't have to wait for `'connect'` event to send. Events sent before connection is opened would be queued, and will be sent after it's connected.

### `useEventReducer` Hook

To use client in the react component (e.g. a next.js page), one convenient way is using the `useEventReducer` hook. For example, an app that shows data to user may work like this:

```js
import WebviewClient, { useEventReducer } from '@machinat/webview/client';

// ...

export default function Home() {
  const data = useEventReducer(
    client,
    (currentData, { event }) => {
      if (event.type === 'app_data') {
        return event.payload;
      }
      if (event.type === 'color_updated') {
        return { ...currentData, color: event.payload };
      }
      return data;
    },
    { color: '#000', content: 'loading...' }
  );
  
  function handleColorChange(e) {
    client.send({ type: 'update_color', payload: e.target.value });
  }

  return (
    <main>
      <input type="color" value={data.color} onChange={handleColorChange} />
      <div style={{ textColor: data.color }}>Content: {data.content}</div>
    </main>
  );
}
```

`useEventReducer(client, reducer, initialState)` take a reducer function of type `(state, eventContext) => newState`. Every time a event emitted from client, the reducer function is called to get the new state. It useful to maintain real-time data synchronized with server.

One simple data transmitting pattern is like:

1. Server sends data to client when `connect` event is received.
2. Client receives and displays the data.
3. After user make a change, client send an updating event to server.
4. Server store the change and sends a confirmation event to client.
5. Client update view for the data change.


## Communication on Server

### Receiving Events

On the server-side, events from client can be received just like other chat platform's. Here's a the server-side codes that respond the previous client example:

```js
app.onEvent(async ({ platform, event, bot }) => {
  if (platform === 'webview') {
    if (event.type === 'connect') {
      // get data from state...

      return bot.send(event.channel, {
        type: 'app_data',
        payload : { color: '#f00', content: '......' },
      });
    }
    
    if (event.type === 'update_color') {
      // save changes in state...

      return bot.send(event.channel, {
        type: 'color_updated',
        payload: event.payload,
      });
    }
  }
});
```

The event handler will receive event contexts with the following properties:

- platform - `'webview'`.
- bot - the webview bot.
- event - `object`, the same as `event` of client-side context.
- metadata - `object`, info about WebSocket connection.
  - source - `'websocket'`.
  - request - `object`, http upgrade request info.
  - auth - `object`, the same as `auth` of client-side context.
  - connection - `object`, the same as `event.channel`.

The `connect` and `disconnect` event will also be received on server-side when a connection's status change.

### Send Event to a Connection

```js
const result = await bot.send(connection, eventObj);
```

The `event.channel` on webview context refers to the connection to sender client. `bot.send(conn, eventObj)` method take a connection and send event back to the client. The `category`, `type` and `payload` properties can be set on event object like `client.send(eventObj)`.

Note that a result will be resolved even when the sending is fail to complete (e.g. client offline). You can tell whether it succeed like this:

```js
const result = await bot.send(event.channel, {
  type: 'foo',
  payload: 'bar',
});
if (result.connections.length === 0) {
  console.log('sending is not completed');
}
```

### Broadcast by User

```js
const result = await bot.sendUser(user, eventObj);
```

Since an user can opens many webviews at a time, you might want keep the content of all webviews consistent. Use `sendUser` method to send a event to all the clients that logged in as the same user.

```js
app.onEvent(async context => {
  const { event, bot } = context;

  if (event.type === 'new_todo') {
    const result = await bot.sendUser(event.user, {
      type: 'todo_added',
      payload: event.payload,
    });
    
    result.connections; // the connections successfully sent to
  }
});
```

### Broadcast by Topic

In some case you would need to send to many connection at one time, for example to make multi-player game. To achieve this, first register the subscription to a string topic:

```js
await bot.subscribeTopic(connection, topicName);
```

Then we can send a event to all the connection that subscribe the topic like:

```js
const result = await bot.sendTopic(topicName, eventObj);
```

To put them together, the folowing example enable all the users on webview to say hello to each other with a global topic:

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
    
    result.connections; // the connections successfully sent to
    return;
  }
});
```

The subscribed topic can also be unsubscribed with:

```js
await bot.unsubscribeTopic(connection, topicName);
```


### Interact With Chat

The feature in the webview can also be integrated with chatroom. The `metadata.auth.channel` would refer to the original chat where the user comes from. We can then use base bot to send messages to the chatroom:

```js
app.onEvent(
  container({ deps: [Machinat.Bot] })(
    (baseBot) =>
      async ({ platform, metadata, event }) => {
        if (platform === 'webview' && event.type === 'connect') {
          const { channel: chatChannel } = metadata.auth;

          await baseBot.render(
            chatChannel,
            <p>I see you on the webview!</p>
          );
        }
      }
  )
);
```

## Next

Learn how to build the application control flow with reactive programming in [next section](reactive-programming.md).
