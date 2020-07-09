# Receiving Events


```js
```

- `platform` - `string`, the platform name.

- `event` - `any`, present the event has happened. Despite the basic properties listed, there are some [standard mixins]() interface on specific type/subtype of event.
  - `platform` - `string`, platform the event belongs to.
  - `type` - `string`, the platform defined event type.
  - `subtype` - `string`,  the platform defined event subtype.
  - `payload` - `object`, the raw event received and parsed from platform.


- `channel` - `object`, refer to the location where the event has happened. It might be a chat thread, a WebSocket connection or something else depends on platform implementation.
  - `platform` - `string`, platform the channel belongs to.
  - `uid` - `string`, unique id in Machinat.


- `user` - `null | object`, refer to the user related to the event if exist.
  - `platform` - `string`, platform the channel belongs to.
  - `uid` - `string`, unique id in Machinat.


- `metadata` - `object`, the metadata of how the event being transmitted depends on platform implementation.
  - `source` - `string`, the source type of the event.


- `bot` - `null | object`, corresponded bot of platform which the event comes from if exist.
  - `platform` - `string`, platform the channel belongs to.
  - `render` - `function`, check [_Rendering Elements_]() for more details.

### Standard Event Mixins

Standard mixins listed here should be implement on specific type/subtype by all platforms. This allow you to get critical information without knowing the platform and the shape of payload like this:

```js
bot.onEvent(({ event, bot, channel }) => {
  if (event.type === 'message' && event.subtype === 'text') {
    bot.render(channel, `${event.text} is good!`);
  }
});
```

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
