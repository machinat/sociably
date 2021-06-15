---
title: Integrate with Webview
---

# Integrate with Webview

CUI brings us a new way to communicate with users, but it's not a replacement of GUI totally. GUI is still outperforming to control the operations need precision, instant interactions or multitasking in an app.

The best practice we suggest is a hybrid experience combining the advantage of both. While CUI is easy to use, easy to broadcast and more closed to the user, GUI can be used to provide more advanced and complicated features.

## WebView and WebSocket

Opening an web page is the simplest way extend chat experience with GUI. Machinat have a `WebSocket` platform to provide event-based communication between your webview client and server.

Add the `WebSocket` platform like this:

```js
import Machinat from '@machinat/core'
import WebSocket from '@machinat/websocket';

const app = Machinat.createApp({
  ...
  platforms: [
    ...
    WebSocket.initModule({
      entryPath: '/websocket',
    }),
  ],
})
```

### Handle Events in Server

Now you can receive events from the client in the webviews as other platforms do:

```js
app.onEvent(async ({ platform, event, bot }) => {
  if (platform === 'websocket') {
    if (event.type === 'greeting') {
      return bot.send(event.channel, {
        type: 'greeting',
        payload : '👋',
      });
    }
    // handle other event types ...
  }
});
```

##### `channel`

The `context.channel` received in `WebSocket` platform refers to a websocket connection. You can use it to send the response message back.

##### `event`

The `context.event` object contains `category`, `type` and `payload` sent from clients. You are free to send any data that can be serialized with `JSON.stringify` in the `payload`. There are also two native event type of `'connection'` category:

- `'connect'` - emit when a connection is connected.
- `'disconnect'` - emit when a connection is disconnected.

##### `bot`

Normally you don't need the rendering process to communicate with client since there is no UI involved. So the `bot.send()` method of the `WebSocketBot` is recommended over `bot.render()`.

`bot.send(channel, event)` method take the connection channel and an event object with the same structure as `context.event`:

- `category` - optional, `string`, set to `'default'` if not specified.
- `type` - required, `string`, the event type.
- `payload` - optional, `any`.

### Client Side

In the client-side, you can easily communicate with server with:

```js
import WebSocketClient from '@machinat/websocket/client';

const client = new WebSocketClient({
  url: '/websocket',
});

client.onError(console.error);

client.onEvent(({ event }) => {
  if (event.type === 'connect') {
    client.send({
      type: 'greeting',
      payload : '👋',
    });
  }
})
```

Callback pass to `client.onEvent()` would receive a similar context as server-side app, but contains only `event`, `channel` and `user` properties. The `'connect'` and `'disconnect'` event would also be emitted when the connection is connected/disconnected.

`client.send(event)` take an event object parameter like `bot.send` and send it to the server. You don't have to wait `'connect'` event for sending. Events being sent before connection is made would be queued, and fire after it is connected.

### Serve the Web App

You are free to choose any way to build and serve the web app. But if you are using React and Next.js for server rendering, you can use [`@machinat/next`](https://github.com/machinat/machinat/tree/master/packages/next) to serve a Next.js server along with your Machinat app.

## Integrate Authorization

Now you are able to communicate with Machinat app from web. But to make the web page as an extended view of chatroom, you have to integrate the authorization with the original chat platforms.

With the auth information, you are able to provide chatroom/user scoped features or data in your webview. For example: memos for chatroom, cooperative whiteboard or even multi-player games in a chat group.

### Auth Module and Authorizers

First you have to add some more services like:

```js
import Machinat from '@machinat/core'
import WebSocket from '@machinat/websocket';
import { useAuthController } from '@machinat/websocket/auth';
import Auth from '@machinat/Auth';
import MessengerAuthorizer from '@machinat/messenger/auth';
import LineAuthorizer from '@machinat/line/auth';

const app = Machinat.createApp({
  ...
  platforms: [
    ...
    WebSocket.initModule({
      entryPath: '/websocket',
    }),
    Auth.initModule({
      apiPath: '/auth',
      secret: '__SECRET_STRING__',
    }),
  ],
  services: [
    { provide: Auth.AuthorizerList, withProvider: MessengerAuthorizer },
    { provide: Auth.AuthorizerList, withProvider: LineAuthorizer },
    { provide: WebSocket.LoginVerifier, withProvider: useAuthController },
  ],
})
```

The `Auth` module provide an interface to authorize users with the chat platform they come from. Then register `Auth.AuthorizerList`interface with the authorizers provided by supported chat platforms. Finally, register `WebSocket.LoginVerifier` with `useAuthController` adapter to connect with `Auth` module.

And in the client:

```js
import WebSocketClient from '@machinat/websocket/client';
import useAuthClient from '@machinat/websocket/auth/client';
import AuthClient from '@machinat/auth/client';
import MessengerAuthorizer from '@machinat/messenger/auth/client'
import LineAuthorizer from '@machinat/messenger/auth/client'

const authClient = new AuthClient({
  serverUrl: '/auth',
  authorizers: [
    new MessengerAuthorizer({
      appId: fbAppId,
    }),
    new LineAuthorizer({
      providerId: lineProviderId,
      botChannelId: lineBotChannelId,
      liffId: lineLIFFId,
    }),
  ],
});

const webSocketClient = new WebSocketClient({
  url: '/websocket',
  login: useAuthClient(authClient),
});
```

First we initiate an `AuthClient` with the authorizers of supported chat platforms. Then bind it the `login` option of websocket client with the `useAuthClient` adapter.

By default the `AuthClient` would use the `platform` parameter of querystring to decide which platform the user should login with. For example, to make the user login in Messenger platform, direct the user to `https://your.app/page?platform=messenger`. Or you can specify the `platform` options of the `AuthClient` like:

```js
const authClient = new AuthClient({
  platform: 'telegram',
  serverUrl: '/auth',
  authorizers: [...],
});
```

### Get Auth Information

After setup, the `user` would be set to the chat platform user instead of `null` while receiving `WebSocket` events. And more info about auth can be found at `metadata.auth`:


```js
app.onEvent(container({
  deps: [Messenger.Bot]
})(messengerBot => async context => {
  const { platform, metadata, event } = context;

  if (platform === 'websocket' && event.type === 'greeting') {
    const {
      platform: sourcePlatform,
      channel: sourceChannel,
    } = metadata.auth;

    if (sourcePlatform === 'messenger') {
      await messengerBot.render(
        sourceChannel,
        'I see you in the webview!'
      );
    }
  }
}));
```

The example above sends a message to the source chatroom when user opens a webview in it. The `metadata.auth` object contains the following information:

- `platform` - `string`, source platform name.
- `user` - `object`, the user from source platform.
- `channel` - `null | object`, the source channel user comes from. The value would be `null` if not able to determine.
- `loginAt` - `Date`, the time user logged in.
- `expireAt` - `Date`, the time auth would expired.
- `data` - `any`, raw auth data from chat platform.

## Broadcast by Topic

In some case you would need to send to many connection at one time, for example an in-chatroom multi-player game. You can broadcast message to by a topic like this:

```js
app.onEvent(async context => {
  const { event, bot, channel, metadata } = context;
  const { channel: source } = metadata.auth;

  if (event.type === 'connect') {
    return bot.subscribeTopic(channel, source.uid);
  } else if (event.type === 'greeting') {
    return bot.sendTopic(source.uid, event);
  }
});
```

In the example above the source chat channel uid is used as the topic name, then you can use the topic to provide in-chatroom scoped features.

`bot.subscribeTopic` labels a connection channel subscribing to a topic. `bot.sendTopic` sends messages to all connections subscribing the specific topic. And a topic can be unsubscribe with `bot.unsubscribeTopic`:

```js
bot.unsubscribeTopic(channel, 'foo_topic');
```

## Send by User

Since an user can opens many webviews at a time, you might want keep the content of all webviews consistent. Use the `bot.sendUser(user, event)` for sending to all the clients logged in as the same user.

```js
app.onEvent(async context => {
  const { event, bot, user } = context;

  if (event.type === 'new_todo') {
    return bot.sendUser(user, {
      type: 'todo_added',
      payload: event.payload,
    });
  }
});
```

## Next

Learn how to build the application control flow with reactive programming in [next section](reactive-programming.md).
