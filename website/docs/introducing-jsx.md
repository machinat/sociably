---
title: Introducing JSX
---

In Machinat, we can use the _JSX_ API to build _Chat UI_ in a more expressive way.

```js
app.onEvent(async ({ reply }) => {
  await reply(
    <>
      <p>Hello World!</p>
      <img src="https://machinat.io/greeting.jpg" />
    </>
  );
});
```

The HTML alike codes above are _JSX_.
Each JSX element may represent a part of chat UI.
For example, `<p>...</p>` represents a message bubble in the chatroom.

## JSX Syntax

This section is WIP. You can check the introduction in [React document](https://reactjs.org/docs/introducing-jsx.html#embedding-expressions-in-jsx)
since Machinat share the same JSX syntax with React.

## Why JSX?

_Chat UI_ is not so much different from _Graphical UI_.
It may contain many nesting details and logics not less than a graphical view.
We believe a rendering process is necessary to make dynamic and complex chat UI,
so we can ship best user experiences in a chat.

_JSX_ brings some significant advantages while building chat UI:

### Declarative View

In instant messaging, we usually express with a collection of messages.
They look like a _view_ in the chatroom:

![Example Message as view](./assets/example-message-as-view.png)

Such the expression is the basic unit to proceed a conversation.
In Machinat, we build an _expression view_ like:

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
2. Isolate the presentation logics.
3. Leave all the sending jobs to the framework.

### Rich Messages

On many platforms, we can reply with formatted text and in-chat widgets.
JSX works much better to use these graphical features in codes.
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
    <Machinat.Pause time={1000} />

    <p>Hakuna Matata!</p>
    <Messenger.TypingOn />

    <Machinat.Pause time={2000} />
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
