---
title: Rendering Messages
---

The expression in JSX will be rendered into the messages to be sent.
Once you describe the JSX view, Sociably would handle all the works behind.

Typically there are two ways to render the messages: `reply` and `bot.render`.

```js
app.onEvent(async ({ event, bot, reply }) => {
  await reply(<i>Hello <b>World</b></i>);
  // is the same as
  await bot.render(event.thread, <i>Hello <b>World</b></i>);
});
```

### Sending Text

Rendering a string is the easiest way to send a message:

```js
await bot.render(thread, 'hello world');
```

This is supported by all the platforms.

### The Textual Element Tags

The JSX elements with an uncapitalized tag are _textual_ elements, like `<b></b>`
or `<br />`.
They format or structure text content, and they can be used anywhere textual
content is accepted on a platform.

The supported element tags and their props are listed below:

##### Textual element types:

- `b` - render children bold.
  - `children` - textual content.


- `i` - render children italic.
  - `children` - textual content.


- `s` - render the children with strikethrough.
  - `children` - textual content.


- `u` - render the children with underline.
  - `children` - textual content.


- `code` - render children as monospaced.
  - `children` - textual content.


- `pre` - render children as preformatted.
  - `children` - textual content.

- `br` - add a line break.

### Textual Element

Some element types are *textual*,
which means they are equivalent to pure text in JSX.
Some platform components accept only textual content as children or props.
For example:

```js
await bot.render(
  thread,
  <i>foo <b>bar</b> baz</i>
);
```

### Fragment

You may need to send a collection of messages at a time.
To do this, wrap the messages in a `<>...</>` element, like:

```js
await bot.render(
  thread,
  <>
    Look at the kitten!
    <Facebook.Image url="http://..." />
    Aww I'm melting!
  </>
);
```

The element with an empty tag is a _fragment_.
When you `render` a fragment, all the messages inside will be sent in order.
All the sending jobs are handled by the framework,
so you only have to focus on UI.

### Native Component

Lowercased tags only cover textual content.
To render message bubbles, media, templates, or other rich UI, you use
capitalized native components from platform packages.

These platform-specific features are available as **Native Components**.
You can require them from platform packages and use them like:

```js
import * as Facebook from '@sociably/facebook/components'

await bot.render(
  thread,
  <Facebook.MediaTemplate
    type="video"
    url="http://..."
    buttons={
      <Facebook.UrlButton title="Go" url="http://..."/>
    }
  />
);
```

You should only use the native components corresponding to the platform.
If you're making a cross-platform UI,
you can check `context.platform` and choose the native component to use, while
keeping textual fallbacks as plain text and textual elements.
Like:

```js
app.onEvent(async ({ platform, reply }) => {
  await reply(
    <>
      Hi!
      {platform === 'facebook'
        ? <Facebook.Image url="..." />
        : platform === 'telegram'
        ? <Telegram.Photo url="..." />
        : <i>Check this image: https://...</i>}
    </>
  );
});
```

### Pause

`Sociably.Pause` adds a pause between messages.
For example, `<Sociably.Pause time={1000}/>` element delays all the messages after it by 1000 ms.

```js
await bot.render(thread,
  <>
    1
    <Sociably.Pause time={1000} />
    2
    <Sociably.Pause time={1000} />
    3
    <Sociably.Pause time={1000} />
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

bot.render(thread,
  <>
    hello
    <Sociably.Pause delay={waitForSomething} />
    world
  </>
);
```
