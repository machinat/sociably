# Receive Events

After successfully start, the app should be able to receive events from registered platforms. Events of all the platforms can be listened with `app.onEvent()` method like this:

```js
app.onEvent(context => {
  console.log(
    `${context.event.type} from ${context.platform}`
  );
})
```

Every platform implementation emit kinds of events in the format of the event context interface. This helps you to make a cross-platform app with an unified abstraction.

## Event Context Object

The event context is a **plain object** containing the following properties:

- `platform`: `string`, the platform name.

- `event`: `object`, represent the event has happened. Despite the basic properties listed here, some [standard mixins](#standard-event-mixins) are added on the specific kind/type of event.
  - `platform`: `string`, platform where the event comes from.

  - `kind`: `string`, rough classification of the events. Here are some common categories used by most platforms:
    - `'message'`: a text or media message is sent by the user.
    - `'postback'`: the user interact with an app defined UI (like a button) and post data back.
    - `'action'`: a non-message action is initiatively triggered by the user.
    - `'system'`: the event is only between the platform and your app, no user activity is involved.

  - `type`: `string`, the accurate event type.

  - `payload`: `object`, the raw event received and parsed from platform.


- `channel`: `object`, refer to the location where the event has happened. Check the [channel details here](#the-channel).
  - `platform`: `string`, platform the channel belongs to.
  - `uid`: `string`, unique id in Machinat.


- `user`: `null | object`, refer to the user related to the event if exist.
  - `platform`: `string`, platform the user belongs to.
  - `uid`: `string`, unique id in Machinat.


- `metadata`: `object`, the metadata about how the event being transmitted. There could be more information properties depends on platform implementation.
  - `source`: `string`, the source type of the event.


- `bot`: `null | object`, bot corresponded to the platform. If the platform doesn't support replying, the value would be null.
  - `platform`: `string`, platform the bot belongs to.
  - `render(channel, message)`: `function`, reply message to the channel.  Check [_Rendering Elements_](rendering-elements.md) for more details.
    - `channel`: `object`, the channel object.
    - `message`: `string|element`, the message to reply.

### The Channel

_Channel_ is a special abstraction in Machinat, it refer to an unique location which an event is happen at. It could be a chat thread, a WebSocket connection or something else depends on platform implementation.

The `uid` of a channel is an unique string that would promised to be unique across all the platforms. Since it's unique, it can be used as the key while storing data like conversation state.

The channel is also being used as the target to send action back with `bot.render()`.

### Standard Event Mixins

To help you to get information from the various of events, some helper getters are added on the event object. For example, you can get the text message string like this:


```js
bot.onEvent(({ event, bot, channel }) => {
  if (event.kind === 'message' && event.type === 'text') {
    bot.render(channel, `${event.text} is good!`);
  }
});
```

Here we define some common event types and the standard mixins for them. The mixins listed here should be implement on specific kind/type by all platforms. You can use them without knowing the platform and the shape of event payload.

###### Text Message Event
- `kind`: `'message'`
- `type`: `'text'`
- `text`: `string`, the text message.


###### Media Message Event
- `kind`: `'message'`
- `type`: `'image' | 'video' | 'audio' | 'file'`
- `url`: `void|string`, the url of the media if available.

###### Location Message Event
- `kind`: `'message'`
- `type`: `'location'`
- `latitude`: `number`, latitude.
- `longitude`: `number`, longitude.

###### Postback Event
- `kind`: `'postback'`
- `type`: `any`
- `data`: `void | string`, the postback data defined by your app if available.

Each platform might have their own mixins on events, check the docs of platform packages for more details.

### Strategies for Multiple Platforms

To sum up a little bit, here are some strategies for you to handle events from multiple platforms:

1. **By branches**: check `context.platform` to have different reaction logic for different platforms.
2. **Use standard event mixin**: reply to specific message type with the information get from standard mixin.
3. **Cross-platform UI**: reply with a string or an element that is safe for cross-platform. We will discuss more about this at [_Rendering Elements_](rendering-elements.md) later.

Let's put them together:

```js
app.onEvent(({ platform, event, bot, channel }) => {
  if (event.kind === 'message' && event.type === 'text') {
    // reply for a text message
    bot.render(channel, `Hello ${event.text}!`);
  } else if (platform === 'messenger') {
    // reply for messenger platform
    bot.render(channel, 'Hello Messenger!');
  } else {
    // default reply
    bot.render(channel, 'Hello World!');
  }
})
```

### Get Raw HTTP Request

If the your events comes from HTTP request like webhook or websocket, you can get the HTTP request info at `metadata.request`. The `metadata` object from a webhoook event might look like this:

```js
{
  source: 'webhook',
  request: {
    method: 'POST',
    url: 'https://machinat.io/webhook/messenger',
    headers: { ... },
    body: '{"some":"json"}'
  }
}
```

## Handle Errors

In case an exception happen while platform module receiving events, the error will pop to the app. You can listen to the error with `app.onError(handler)`.

```js
app.onError(err => {
  console.error(err)
});
```

## Next

Learn how to make rich expressions with _JSX_ in [next section](introducing-jsx.md).
