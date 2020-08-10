# Integrate with Webview

CUI brings us a new way to communicate with users, but it's not a replacement of GUI totally. GUI is still outperforming to control the operations need precision, instant interactions or multitasking in an app.

The best practice we suggest is a hybrid experience combining the advantage of both. While CUI is easy to use, easy to broadcast and more closed to the user, GUI can be used to provide more advanced and complicated features.

## WebView and WebSocket

Opening an web page is the simplest way extend chat experience with GUI. Machinat have a `websocket` platform to provide event-based communication between your webview client and server.

Add the `WebSocket` as a platform like this:

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

Now you can receive event from the client in webviews as other platforms:

```js
app.onEvent(async context => {
  const { event, bot, channel } = context;

  if (event.platform === 'websocket') {
    if (event.type === 'greeting') {
      return bot.send(channel, {
        type: 'greeting',
        payload : '👋',
      });
    }
    // handle other event types ...
  }
});
```

The `channel` received in `websocket` platform refers to a websocket connection. You can use it to send the response message back.

The `event` contains `type`, `subtype` and `payload` sent from clients, you are free to send any data can be serialized with `JSON.stringify` in the `payload`. There are also two native event type:

- `'connect'` - emit when a connection is connected.
- `'disconnect'` - emit when a connection is disconnected.

`bot.send(channel, event)` method sends an event object with the same structure as event interface:

- `type` - required, `string`
- `subtype` - optional, `string`
- `payload` - optional, `any`

### Client Side

In the client side, you can easily communicate with server with:

```js
import WebClient from '@machinat/websocket/client';

const client = new WebClient({
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

Callback pass to `client.onEvent` would receive a similar context as server-side app, but contains only `event`, `channel` and `user` properties. The `'connect'` and `'disconnect'` event would also be emitted when connected/disconnected.

`client.send(event)` take an event object parameter like `bot.send()` and send it to the server. You don't have to wait `'connect'` event for sending, events would be queued before connection made and fire after it.

### Serve the Web App

You are free to choose any way to build and serve the web app. But if you are using React and Next.js for server rendering, you can use [`@machinat/next`](../packages/machinat-next) to serve a Next.js server along with your Machinat app.

## Integrate Authorization

Now you are able to communicate with Machinat app from web. But to make the web page as an extended view of chatroom, you have to integrate the authorization with the original chat platforms.

With the auth information, you are able to provide chatroom/user scoped features or data in your webview. For example: memos for chatroom, cooperative whiteboard or even multi-player games in a chat group.

### Auth Module and Authorizers

First you have to add some more services like:

```js
import Machinat from '@machinat/core'
import WebSocket from '@machinat/websocket';
import useAuthController from '@machinat/websocket/auth';
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
      entryPath: '/auth',
      secret: '__SECRET_STRING__',
    }),
  ],
  bindings: [
    { provide: Auth.AUTHORIZERS_I, withProvider: MessengerAuthorizer },
    { provide: Auth.AUTHORIZERS_I, withProvider: LineAuthorizer },
    { provide: WebSocket.AUTHENTICATOR_I, withProvider: useAuthController },
  ],
})
```

The `Auth` module provide an interface to authorize users with the chat platform they come from. Then register `Auth.AUTHORIZERS_I`interface with the authorizers provided by supported chat platforms. Finally, register `WebSocket.AUTHENTICATOR_I` with `useAuthController` adapter to connect with `Auth` module.

And in the client:

```js
import WebSocketClient from '@machinat/websocket/client';
import useAuth from '@machinat/websocket/auth/client';
import AuthController from '@machinat/websocket/client';
import MessengerAuthorizer from '@machinat/messenger/auth/client'
import LineAuthorizer from '@machinat/messenger/auth/client'

const authController = new AuthController({
  serverURL: '/auth',
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

const client = new WebSocketClient({
  url: '/websocket',
  authorize: useAuth(authController),
});

authController.bootstrap();
```

First we initiate an `AuthController` with the authorizers of supported chat platforms. Then bind it the `authorize` option of websocket client with the `useAuth` adapter.

The final step is to call `authController.bootstrap(platform)`, it initiate necessary works to register user on the specified platform. If the platform argument is omitted, `platform` param in querystring is used.

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