# Receive Events

After successfully start, the app should be able to receive events from registered platforms. The event can be listened with `app.onEvent()` method like:

```js
app.onEvent(context => {
  console.log(
    `${context.event.type} from ${context.platform}`
  );
})
```

To handle events from different platforms, Machinat have a common event context interface that every platform should implement.

## Event Context Object

The event context is a plain object containing the following properties:

- `platform` - `string`, the platform name.

- `event` - `object`, represent the event has happened. Despite the basic properties listed here, there are some [standard mixins]() interface on specific type/subtype of event.
  - `platform` - `string`, platform the event belongs to.
  - `type` - `string`, the platform defined event type.
  - `subtype` - `string`,  the platform defined event subtype.
  - `payload` - `object`, the raw event received and parsed from platform.


- `channel` - `object`, refer to the location where the event has happened. Check the [channel details here](#the-channel).
  - `platform` - `string`, platform the channel belongs to.
  - `uid` - `string`, unique id in Machinat.


- `user` - `null | object`, refer to the user related to the event if exist.
  - `platform` - `string`, platform the channel belongs to.
  - `uid` - `string`, unique id in Machinat.


- `metadata` - `object`, the metadata of how the event being transmitted depends on platform implementation.
  - `source` - `string`, the source type of the event.


- `bot` - `null | object`, bot corresponded to the platform. If the platform doesn't support replying, the value would be null.
  - `platform` - `string`, platform the channel belongs to.
  - `render(channel, message)` - `function`, reply message to the channel.  Check [_Rendering Elements_](docs/rendering-elements.md) for more usage guides.
    - `channel` - `object`, the channel object from `context.chareceivednnel`.
    - `message` - `string | element`, the message to reply.

### The Channel

_Channel_ is a special abstraction in Machinat, it refer to an unique location which an event is happen at. It might be a chat thread, a WebSocket connection or something else depends on platform implementation.

The `uid` of a channel is an unique string that should be unique across all the platforms. Since it's unique, it can be used as the key while storing data like session state.

The channel is also being used as the target to send reaction back with `bot.render()`.

### Standard Event Mixins

To help you to get information from the various of events, some helper getters are added on the event object. For example, you can get the text message string like this:


```js
bot.onEvent(({ event, bot, channel }) => {
  if (event.type === 'message' && event.subtype === 'text') {
    bot.render(channel, `${event.text} is good!`);
  }
});
```

Here we define some common event types and the standard mixins for them. The mixins listed here should be implement on specific type/subtype by all platforms. You can use them without knowing the platform and the shape of event payload.

- Text Message
  - `type` - `'message'`
  - `subtype` - `'text'`
  - `text` - `string`, the text message.


- Media Message
  - `type` - `'message'`
  - `subtype` - `'image' | 'video' | 'audio' | 'file'`
  - `url` - `void | string`, the url of the image if exist.


- Postback
  -  `type` - `'postback'`
  -  `data` - `string`, the postback data received.

Each platform might have their own mixins on the event, check docs of platform module for details.

### Strategies for Multiple Platforms

To sum up a little bit, here are some strategies for you to handle events from multiple platforms:

1. **By branches**: check `context.platform` to have different reaction logic for different platforms.
2. **Use standard event mixin**: reply to specific message type with the information get from standard mixin.
3. **Cross-platform UI**: reply with a string or an element that is safe for cross-platform. We will discuss more about this at [_Rendering Elements_](docs/rendering-elements.md) later.

Let's put them together:

```js
app.onEvent(({ platform, event, bot, channel }) => {
  if (event.type === 'message' && event.subtype === 'text') {
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

Now you should able to make a simple _hello world_ bot work! Next section will show you how to make a more enriched reply using [JSX](docs/introducing-jsx.md).
