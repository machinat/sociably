---
title: Components for Chat UI
---

While the app grows, you'll need to reuse UI to build more features and experiences.
You can split parts of the chat UI into **Components** for reusing them.

Components helps to keep your code [DRY](https://en.wikipedia.org/wiki/Don%27t_repeat_yourself).
This is important while building a complex and feature-rich app.

## Functional Components

A component is simply a function that returns a part of chat UI.
It can be used as the element tag like:

```jsx
function Hello() {
  return <p>Hello World!</p>;
}

bot.render(
  channel,
  <>
    <Hello />
    <p>I'm a bot.</p>
  </>
);
```

The code above works the same as:

```js
bot.render(
  channel,
  <>
    <p>Hello World!</p>
    <p>I'm a bot.</p>
  </>
);
```

The name of a component must be **capitalized**.
An element with uncapitalized tag is treated as a general element.

### Component Props

A component function receive the **props** object.
The props is taken from the attributes of the element.
For example:

```jsx
function Hello(props) {
  return <p>Hello {props.name}!</p>;
}

bot.render(
  channel,
  <>
    <Hello name="John Doe" />
    <p>I'm a bot.</p>
  </>
);
```

In the above codes, we to pass `"John Doe"` to the `name` prop.
The dynamic `props.name` value is then used to generate UI in the component.

### `children` Prop

An element can contain children nodes.
They are available as `children` prop in the component.
For example:

```jsx
function Hello(props) {
  return (
    <>
      <p>Hello {props.name}!</p>;
      {props.children}
    </>
  );
}

bot.render(
  channel,
  <Hello name="John Doe">
    <p>I'm a bot.</p>
  </Hello>
);
```

In the above codes, we pass the `<p>I'm a bot.</p>` children to the component.
The `props.children` is then returned with the hello message attached.

The `children` is useful to decorate messages,
like adding a greeting, a menu widget or a feedback query. 

## Composing Components

Other components can be used in the output of a component too.
Like:

```js
function RecommendDailySpecial() {
  return (
    <>
      <p>Today's special is Chirashi Sushi!</p>
      <img src="http://..." />
    </>
  );
}

function Welcome({ name }) {
  return (
    <>
      <Hello name={name} />
      <RecommendDailySpecial />
    </>
  );
}

bot.render(channel, <Welcome name="Jojo" />);
```

We can use components to modulize chat UI at many levels,
from the word choices to the whole expression.
This helps to optimize user experiences .

## Cross-Platform Component

While making a cross-platform app,
it's common to have different presentations according to the platform.
For example:

```js
import * as Messenger from '@machinat/messenger/components';
import * as Telegram from '@machinat/telegram/components';

function AskForOrder(props, { platform }) {
  if (platform === 'messenger') {
    return (
      <Messenger.ButtonTemplate
        buttons={<>
          <Messenger.PostbackButton title="🌭" payload="hotdog" />
          <Messenger.PostbackButton title="🌮" payload="taco" />
        </>}
      >
        Which one would you like?
      </Messenger.ButtonTemplate>
    );
  }
  if (platform === 'telegram') {
    return (
      <Telegram.Text
        replyMarkup={
          <Telegram.ReplyKeyboard>
            <Telegram.TextReply text="🌭" />
            <Telegram.TextReply text="🌮" />
          </Telegram.ReplyKeyboard>
        }
      >
        Which one would you like?
      </Telegram.Text>
    );
  }
  return <p>Would you like <b>hotdog</b> or <b>taco</b>?</p>
}
```

`platform` of the second param shows which platform is rendering to.
We can return different native components according to it.

At the end of the function, we can add a default UI using only general elements.
This ensure the component can be used on all the platforms.
