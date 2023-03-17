---
title: Components for Chat UI
---

While the app grows, you'll need to reuse the UI for making more features and experiences.
You can split parts of the chat UI into **Components** for reusing them.

Component helps to keep your code [DRY](https://en.wikipedia.org/wiki/Don%27t_repeat_yourself).
This is important while building a complex and feature-rich app.

## Functional Components

A component is simply a function that returns a part of the chat UI.
It can be used as the element tag like:

```jsx
function Hello() {
  return <p>Hello World!</p>;
}

bot.render(
  thread,
  <>
    <Hello />
    <p>I'm a bot.</p>
  </>
);
```

The code above works the same as:

```js
bot.render(
  thread,
  <>
    <p>Hello World!</p>
    <p>I'm a bot.</p>
  </>
);
```

The name of a component must be **capitalized**.
An element with an uncapitalized tag is treated as a general element.

### Component Props

A component function receive the **props** object,
which is taken from the attributes of the element.
For example:

```jsx
function Hello(props) {
  return <p>Hello {props.name}!</p>;
}

bot.render(
  thread,
  <>
    <Hello name="John Doe" />
    <p>I'm a bot.</p>
  </>
);
```

In the above codes, we pass `"John Doe"` to the `name` prop.
The dynamic `props.name` value is then used to generate UI in the component.

### `children` Prop

An element can contain children nodes.
They are available as the `children` prop in the component.
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
  thread,
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

bot.render(thread, <Welcome name="Jojo" />);
```

We can use components to modularize chat UI at many levels,
from the word choices to the whole expression.
This helps to optimize user experiences .

## Cross-Platform Component

While making a cross-platform app,
it's common to have different presentations according to the platform.
For example:

```js
import * as Facebook from '@sociably/facebook/components';
import * as Telegram from '@sociably/telegram/components';

function AskForOrder(props, { platform }) {
  if (platform === 'facebook') {
    return (
      <Facebook.ButtonTemplate
        buttons={<>
          <Facebook.PostbackButton title="🌭" payload="hotdog" />
          <Facebook.PostbackButton title="🌮" payload="taco" />
        </>}
      >
        Which one would you like?
      </Facebook.ButtonTemplate>
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
This ensures the component can be used on all the platforms.
