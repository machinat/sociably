# Rendering Elements

### `Bot#render(channel, message)`

Bots of all the platforms implement the `render` method. For the most of time, `render` is the only entry you need to send various kinds of messages.

- `channel` - the target to send the rendered messages, typically refers to a chat room.
- `message` - string or message element to be rendered.

### Sending Text

The most basic way to to send a message is render string directly:

```js
bot.render(channel, 'hello world');
```

this is supported by all the platforms.

### Fragment

A fragment is a collection of nodes contained by a `<>...</>` element. This help you to construct UI with a series of content to send:

```js
bot.render(
  channel,
  <>
    Look at the kitty!
    <img src="http://..." />
    Aww I'm melting!
  </>
);
```

When you render with a fragment, all of the messages rendered from children will be sent in order.

### Textual Node

An element type is *textual* if it renders into strings and other textual elements only. **Textual nodes** include text and textual element or a collection of them.

Neighbor textual nodes will be merged into one text message, for example this renders content in a single text bubble in chatroom:

```js
bot.render(
  channel,
  <>foo <b>bar</b> <i>baz</i></>
);
```

### General Element Type

Element with string type (lower cased beginning JSX tag) in Machinat is _general_ that it can be rendered by bots of all platforms. Supported element tags and its props are listed below.

Textual element types:

- `b` - make children bold if supported.
  - `children` - textual node.


- `i` - make children italic if supported.
  - `children` - textual nodes.


- `del` - mark the children as deleted if supported.
  - `children` - textual nodes.


- `code` - make children monospaced if supported.
  - `children` - textual nodes.


- `pre` - mark children as preformatted if supported.
  - `children` - textual nodes.


Non-textual element types:

- `br` - add a break, in IM platforms it separate content into different text bubbles. It worth noting `<br/>` is not textual so something like `<i><br/></i>` would throw when render.

- `p` - wrap textual content paragraph as text messages. It accepts `<br/>` in the children for separation, in IM platforms `<p>foo<br/>bar</p>` renders into 2 text bubbles.
  - `children` - textual nodes but includes `<br/>`.


- `img` - send an image message.
  - `src` - URL string.


- `audio` - send an audio message.
  - `src` - URL string.


- `video` - send a video message.
  - `src` - URL string.


- `file` - send a file message.
  - `src` - URL string.

### Native Component

The general element types provide a set of unified APIs to make the cross-platform UI. But you might want to use more features that only available on particular platform. Use the **native component** from each platform package as the element type like this:

```js
import { MediaTemplate, URLButton } from '@machinat/messenger/components'

bot.render(
  channel,
  <MediaTemplate
    type="video"
    url="http://..."
    buttons={
      <URLButton title="Go" url="http://..."/>
    }
  />
);
```

You can only use native component corresponded to the platform of bot. If a bot receive a native component from a different platform when `render`, it would immediately throw at render time.

### Pause

`Machinat.Pause` is an utility to make a pause between messages. Add a `<Machinat.Pause/>` element and set `until` prop to an async function. The `until` function will be awaited while sending and postpone sending of the rest messages afterward.

```js
import delay from 'delay';

const delayOneSec = () => delay(1000);

bot.render(channel,
  <>
    1
    <Machinat.Pause until={delayOneSec} />
    2
    <Machinat.Pause until={delayOneSec} />
    3
    <Machinat.Pause until={delayOneSec} />
    Red light!
  </>
);
```
