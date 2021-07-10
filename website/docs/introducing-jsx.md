---
title: Introducing JSX
---

In Machinat, you can use the _JSX_ syntax API to build the _Conversational User Interface_ (CUI) more expressively.

```js
app.onEvent(async ({ reply }) => {
  await reply(
    <p>
      Hello,
      <br />
      World!
    </p>
  );
});
```

If you have used [React.js](https://reactjs.org) before, you might be familiar with it already. Machinat share almost the same syntax and element structure with React, and have an alike rendering system we will discuss in the next section.

## JSX Syntax

This part is WIP, you can check [the doc of React.js](https://reactjs.org/docs/introducing-jsx.html) since Machinat and React share the same JSX syntax.

## Why JSX?

During the experiences buiding chatbots, we find out _Conversational User Interface_ and _Graphical User Interface_ have some common ground and both need a declarative way to make the complex UI.

JSX, which has proved to be an extraordinary tool to build GUI, could benefit us building CUI in several aspects.

### Declarative way to talk

Consider the following dialogue in a chat room:

![Example Message as view](./assets/example-message-as-view.png)

As you see a dialogue is usually proceed by a collection of messages each time, let's call them an *expression*. In Machinat, an expression is the atomic unit for sending. You don't have to call many API to make the expression, the upper example can be made by:

```js
reply(
  <>
    This is my cat!
    <img src="http://foo.bar/cat.jpg" />
    Do you like it?
  </>
);
```

This provide a way to build CUI more declaratively. The sending of all messages in an expression is managed and promised by Machinat, so you can focus on crafting the UI.

### Rich formatting view

Most platform provide some ways to send rich formatting text message or more complex widgets in the chatroom. JSX is better to show the "view" of an expression in codes declaratively than huge and nested JSON.

```js
reply(
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

### Pause and other in-chat behavior

Proper pause may make your speech more understandable and comfortable in a chat. Pause and other in-chat behaviors thus should be able to a part of the user experience.

In Machinat these can all be done in a JSX expression:

```js
reply(
  <>
    Hakuna Matata!
    <Messenger.TypingOn />

    <Machinat.Pause until={() => delay(2000)} />

    {/* will be sent 2 sec after */}
    It means no worry!
  </>
);
```

### Cross-platform API

Cross-platform is a big issue for chatbot because of the fact that there is no dominant messaging platform for now. JSX provide a [domain-specific language](https://en.wikipedia.org/wiki/Domain-specific_language) flexible enough to serve cross-platform API along with complete features of any particular platform.

```js
reply(
  <>
    They both work!
    <video src="http://..." />
    <Messenger.Video attachmentId="_UPLOADED_VIDEO_" />
  </>
);
```

In the case above, the `<video ... />` element is a general API that can be sent to all platforms. The `<Messenger.Video ... />` element is a native API only works in `messenger` platform.
