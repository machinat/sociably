---
title: Rendering Messages
---

The expression in JSX will be rendered into the messages to be sent.
Once you describe the JSX view, Machinat would handle all the works behind.

Typically there are two ways to render the messages: `reply` and `bot.render`.

```js
app.onEvent(async ({ event, bot, reply }) => {
  await reply(<p>Hello World</p>);
  // is the same as
  await bot.render(event.channel, <p>Hello World</p>);
});
```

### Sending Text

Rendering a string is the easiest way to send a message:

```js
await bot.render(channel, 'hello world');
```

This is supported by all the platforms.

### The General Element Tags

The JSX elements with an uncapitalized tag are _general_ elements, like `<p></p>`.
They can be rendered onto all the platforms,
so you can use them to make cross-platform UI easily.

The supported element tags and their props are listed below:

##### Textual element types:

- `b` - render children bold.
  - `children` - textual content.


- `i` - render children italic.
  - `children` - textual content.


- `s` - render the children with strikethrough.
  - `children` - textual content.


- `s` - render the children with underline.
  - `children` - textual content.


- `code` - render children as monospaced.
  - `children` - textual content.


- `pre` - render children as preformatted.
  - `children` - textual content.

- `br` - add a line break.

##### Non-textual element types:

- `p` - send a text message bubble.
  - `children` - textual content.

- `img` - send an image message.
  - `src` - image URL.


- `audio` - send an audio message.
  - `src` - audio URL.


- `video` - send a video message.
  - `src` - video URL.


- `file` - send a file message.
  - `src` - file URL.

### Textual Element

Some element types are *textual*,
which means they're equivalent to pure text in JSX.
Some element accept only texual content as prop,
like `<p></p>`:

```js
await bot.render(
  channel,
  <p>foo <b>bar</b> <i>baz</i></p>
);
```

### Fragment

You may need to send a colections of messages at a time.
To do this, wrap the messages in a `<>...</>` element, like:

```js
await bot.render(
  channel,
  <>
    <p>Look at the kitten!</p>
    <img src="http://..." />
    <p>Aww I'm melting!</p>
  </>
);
```

The element with empty tag is a _fragment_.
When you `render` a fragment, all the messages inside will be sent in order.
All the sending jobs are handled by the framwork,
so you only have to focus on UI.

### Native Component

The general tags provide a set of cross-platfrom APIs.
But you might want to use more special features on particular platform.

These platform-specific features are available as **Native Components**.
You can require them from platform packages and use them like:

```js
import * as Messenger from '@machinat/messenger/components'

await bot.render(
  channel,
  <Messenger.MediaTemplate
    type="video"
    url="http://..."
    buttons={
      <Messenger.UrlButton title="Go" url="http://..."/>
    }
  />
);
```

You should only use the native components corresponded to the platform.
If you're making a cross-platfrom UI,
check `context.platform` and choose different native coomponent like:

```js
app.onEvent(async ({ platform, reply }) => {
  await reply(
    <>
      Hi!
      {platform === 'messenger'
        ? <Messenger.Image url="..." />
        : platform === 'telegram'
        ? <Telegram.Photo url="..." />
        : <img src="..." />}
    </>
  );
});
```

### Pause

`Machinat.Pause` adds a pause between messages.
For example, `<Machinat.Pause time={1000}/>` element delays all the messages after by 1000 ms.

```js
await bot.render(channel,
  <>
    1
    <Machinat.Pause time={1000} />
    2
    <Machinat.Pause time={1000} />
    3
    <Machinat.Pause time={1000} />
    Red light!
  </>
);
```

`delay` prop can also be used to measure the pause time.
It accepts an async function, and the messages afterwards are delayed till the returned promise is resolved.
For example:

```js
async function waitForSomething() {
  await doSomething();
}

bot.render(channel,
  <>
    hello
    <Machinat.Pause delay={waitForSomething} />
    world
  </>
);
```
