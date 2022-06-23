---
title: Introducing JSX
---

In Sociably, we use the _JSX_ API to build _Chat UI_ in a more expressive way.

```js
app.onEvent(async ({ reply }) => {
  await reply(
    <>
      <p>Hello World!</p>
      <img src="https://sociably.io/greeting.jpg" />
    </>
  );
});
```

The code above that looks like HTML is _JSX_.
Each JSX element may represent a part of the chat UI.
For example, `<p>...</p>` represents a message bubble in the chatroom.

## JSX Syntax

This section is WIP. You can check the introduction in [React document](https://reactjs.org/docs/introducing-jsx.html#embedding-expressions-in-jsx)
since Sociably shares the same JSX syntax with React.

## Why JSX?

_Chat UI_ is not that much different from _Graphical UI_.
It may also contain nesting details and logic no less than a graphical view.
We believe a rendering process is necessary to make dynamic and complicated chat UI,
which helps to ship the best user experiences in chat.

_JSX_ brings some significant advantages while building chat UI:

### Declarative View

In instant messaging, we usually express a collection of messages once.
They look like a _view_ in the chatroom:

![Example Message as view](./assets/example-message-as-view.png)

Such an expression is the basic unit to advance a conversation.
In Sociably, we build an _expression view_ like:

```js
await reply(
  <>
    <p>This is my cat!</p>
    <img src="http://foo.bar/cat.jpg" />
    <p>Do you like it?</p>
  </>
);
```

In this way we make a declarative UI of the _view_,
instead of making many imperative API calls.
This brings some advantages:

1. Describe the content better in codes.
2. Isolate the presentation logic.
3. Leave all the sending jobs to the framework.

### Rich Messages

On many platforms, we can reply with formatted text and in-chat widgets.
JSX works much better to use these graphical features in code.
Like:

```js
await reply(
  <>
    <p>
      <b>foo</b>
      <i>bar</i>
      <code>baz</code>
    </p>

    <Messenger.GenericTemplate>
      <Messenger.GenericItem
        title="Hello"
        subtitile="world"
        imageUrl="http://..."
      />
    </Messenger.GenericTemplate>
  </>
);
```

### Pause and Action

Adding proper pauses and actions brings better experience in chat. 
These in-chat behaviors can be well described in JSX too.
Like this:

```js
await reply(
  <>
    <Messenger.MarkSeen />
    <Sociably.Pause time={1000} />

    <p>Hakuna Matata!</p>
    <Messenger.TypingOn />

    <Sociably.Pause time={2000} />
    <p>It means no worry!</p>
  </>
);
```

### Cross-platform UI

To make cross-platform apps, you'll need cross-platform UI.
Thanks to the flexibility of JSX,
we can use several manners to achieve that:

```js
await reply(
  <>
    These videos all work:

    <video src="http://..." />

    {platform === 'messenger'
      ? <Messenger.Video attachmentId="_UPLOADED_VIDEO_" />
      : null}
  
    <MyCrossPlatformVideo />
  </>
);
```

The expression above works on every platform.
We'll introduce these APIs in later chapters.
