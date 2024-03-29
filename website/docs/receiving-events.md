---
title: Receiving Events
---

A sociable app is actually an _event-driven_ server behind the scene.
It receives events from external platforms and makes reactions to the users.

In Sociably, you can listen to all the events in a single `app.onEvent()` entry.

```js
const app = Sociably.createApp({/*...*/});

app
  .onEvent(context => {
    console.log(
      `${context.event.type} from ${context.platform}`
    );
  })
  .start();
```

## Event Context Object

Events from every platform implement the event context interface. 
It's a plain object with the following properties:

- `platform`: `string`, the platform name.

- `event`: `object`, represent the happened event. More info is available depending on the event type. Check the [event mixins](#event-mixins).
  - `platform`: `string`, platform of the event.

  - `category`: `string`, rough classifications of the events. Here are some common categories:
    - `'message'`: a message sent by the user.
    - `'postback'`: the user interacts with an UI defined by the app (like a button).
    - `'action'`: a non-message action triggered by an user.
    - `'system'`: an event from the platform, no user activity is involved.

  - `type`: `string`, the accurate event type.

  - `payload`: `object`, the raw event data from the platform.

  - `thread`: `object`, the chat thread where the event happened. Check the [details here](#thread).
    - `platform`: `string`, platform of the thread.
    - `uid`: `string`, unique id of the thread.


  - `user`: `null | object`, the user who triggered the event.
    - `platform`: `string`, platform of the user.
    - `uid`: `string`, unique id of the user.


- `metadata`: `object`, the transmission metadata of the event. More info is available depending on the implementation.
  - `source`: `string`, the source type of the event, typically 'webhook'.

- `bot`: `null | object`, the `Bot` instance for making reactions. Check [_Rendering Messages Doc_](rendering-messages.md) for more details.
  - `platform`: `string`, platform of the bot.
  - `render(thread, message)`: `function`, send messages to a thread.
    - `thread`: `object`, the thread object.
    - `message`: `string|element`, the messages to be sent.

- `reply(message)`: `function`, a sugar to reply messages to the current thread. It works the same as `bot.render(event.thread, messages)`.
  - `message`: `string|element`, the messages to be replied.

### Thread

_Thread_ is a special abstraction that refers to the location where events happen.
It could be a chat thread, a WebSocket connection or any place depending on the platform.

`thread.uid` is the identifier string of the thread.
It's unique across all the platforms,
so you can use it as the key to store data like the chat state.

Many services require the thread to work.
The most common one is sending reactions back,
like `bot.render(event.thread, <Hello />)`.

### Identify Event

You can identify the received event type by the `platform`, `category` and `type` keys.
For example, this reply a mirrored text when a text message is met:

```js
app.onEvent(async ({ event, reply }) => {
  if (event.category === 'message' && event.type === 'text') {
    await reply(event.text.toUpperCase() + '!!!');
  }
});
```

#### Event Mixins

`context.event` also contains some details about each type of event.
Like in the example above, we get `event.text` from the events with `'message'` category and `'text'` type.
 
Here are the common event mixins:

###### Text Message Event
- `category`: `'message'`
- `type`: `'text'`
- `text`: `string`, the message text.


###### Media Message Event
- `category`: `'message'`
- `type`: `'image' | 'video' | 'audio' | 'file'`
- `url`: `undefined | string`, URL of the media if available.

###### Location Message Event
- `category`: `'message'`
- `type`: `'location'`
- `latitude`: `number`, the latitude.
- `longitude`: `number`, the longitude.

###### Postback Event
- `category`: `'postback'`
- `type`: `'postback'`
- `data`: `undefined | string`, the postback data.

These common mixins are implemented by all the platforms.
You can use them to build platform-agnostic features as the example above.

Each platform also has its own event mixins, check [API references](pathname:///api) for the details.
Also we recommend using [TypeScript](https://www.typescriptlang.org/) to have types support the events while developing.

### Serving for Multiple Platforms

Serving on multiple platforms is important on social media.
You can handle events from different platforms in two strategies:

1. Use common event mixins to make platform-agnostic reaction, like:

```js
app.onEvent(async ({ event, reply }) => {
  if (event.category === 'message' && event.type === 'text') {
    // handle text messages
    await reply(`Hello ${event.text}`);
  } else if (event.category === 'message' && event.type === 'image') {
    // handle image messages
    await downloadImage(event.url);
  }
});
```

2. Check `context.platform` to make different reaction by platform, like:

```js
app.onEvent(async ({ platform, reply }) => {
if (platform === 'facebook') {
    // handle events from Facebook
    await reply('Hello Facebook!');
  } else {
    // handle events from Telegram
    await reply('Hello Telegram!');
  }
})
```

### Get Raw HTTP Request

In most cases, events from platforms are transmitted through HTTP requests.
Check `metadata.request` if you need details like the HTTP headers.

For example, `context.metadata` of a webhook event might look like:

```js
{
  source: 'webhook',
  request: {
    method: 'POST',
    url: 'https://sociably.io/webhook/facebook',
    headers: {/*...*/},
    body: '{"some":"json"}'
  }
}
```

## Handle Exepetions

An unhandled error from the app exits the process in newer Node.js versions,
so make sure you subscribe to them with `app.onError(handler)` all the time.

```js
app.onError(err => {
  console.error(err);
});
```

Note that the HTTP `4xx` on the webhook,
like `Bad Request` or `Unauthorized`,
are not treated as errors.
These invalid requests are not popped to either the `onEvent` or `onError` method.
