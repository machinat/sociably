# Introducing JSX

Machinat use the JSX syntax API to build the _Chat User Interface_ (CUI).

```js
app.onEvent(async ({ bot, channel }) => {
  await bot.render(channel, (
    <p>
      Hello,
      <br />
      World!
    </p>
  ));
});
```

If you have used [React.js](https://reactjs.org) before, you might be familiar with it already. Machinat share almost the same syntax and element structure with React, and have an alike rendering system we will discuss in the next section.

## Why JSX?

During the experiences buiding chatbots, we find out _Chat User Interface_ and _Graphical User Interface_ have some common ground and both need a declarative way to make the complex UI. JSX, which has proved to be an extraordinary tool to build GUI, could benefit us building CUI in several aspects.

### Expressive way to talk

Consider the following dialogue in a chat room:


As you see a dialogue is usually proceed by a collection of messages each time, let's call them an *expression*. In Machinat, an expression is the atomic unit for sending. You don't have to call many API to make the expression, the upper example can be made by:

```js
bot.render(
  channel,
  <>
    This is my cat.
    <img src="http://foo.bar/cat.jpg" />
    Do you like it?
  </>
);
```

This provide a way to build CUI declaratively and expressively. The sending of all messages in an expression is managed and promised by Machinat, and you can focus on crafting the UI.

### Cross-platform API

Cross-platform is a big issue for chatbot because of the fact that there is no dominant messaging/voice assistant platform for now. JSX provide a [domain-specific language](https://en.wikipedia.org/wiki/Domain-specific_language) flexible enough to serve an unified cross-platform API along with complete features of any particular platform.

  ```js
  bot.render(
    channel,
    <>
      They both work!
      <video src="http://..." />
      <Messenger.Video attachmentId="_UPLOADED_VIDEO_" />
    </>
  );
  ```

  The details of how to make a cross-platform expression is describe at next section.

  ### Rich formatting view

  Most platform provide some ways to send rich formatting text message or more complex widgets in the chatroom. JSX is better to show the "view" of an expression in codes declaratively than huge and nested JSON.

  ```js
  bot.render(
    channel,
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
          imageURL="http://..."
        />
      </Messenger.GenericTemplate>
    </>
  );
  ```

### Pause and other in-chat behavior

Proper pause may make your speech more understandable and comfortable in a chat. Machinat support pause and other in-chat behavior in an expression as a part of CUI.

```js
bot.render(
  channel,
  <>
    Hello World!
    <Messenger.TypingOn />

    <Machinat.Pause until={() => delay(2000)} />

    {/* will be sent 2 sec after */}
    What a wonderful world!
  </>
);
```

## JSX Syntax

This part is WIP, you can check [the doc of React.js](https://reactjs.org/docs/introducing-jsx.html#embedding-expressions-in-jsx) since Machinat and React share the same JSX syntax.
