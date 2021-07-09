---
title: Components for CUI
---

Components let you split chat UI into independent, reusable pieces, and think about each piece in isolation.
This make your code DRY and help you to build a complex, intelligent and characteristic conversation.

## Functional Components

A component is simply a JavaScript function:

```js
function Hello(props) {
  return (
    <p>
      Hello {props.name}!
      <br />
      {props.children}
    </p>
  );
}

bot.render(
  channel,
  <Hello name="Jojo">
    How's your day?
  </Hello>
);
```

The code above work the same as:

```js
bot.render(
  channel,
  <p>
    Hello Jojo!
    <br />
    How's your day?
  </p>
);
```

The component function receive a **props** object and return an element or text. The props is taken from the attributes and _children_ of the element. In the example above, the following object is passed to `Hello` function while rendering:

```js
{
  name: 'Jojo',
  children: 'How is it going?',
}
```

_The component names must start with a capital letter. A tag start with a lowercase letter is considered as string, and it is treated as a general element._

## Composing Components

Other components can also be used in the output. This enable us to compose the whole expression with reusable parts.

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

Depends on the situations, you might have many messaging entries like `Welcome`. And the underlying `Hello` and `RecommendDailySpecial` can be reused many time.

## Cross Platform

It is common to have different presentations according to platform the message is rendered to. For example using a platform specific template if possible like this:

```js
import * as Messenger from '@machinat/messenger/components';

function AskForOrder(props, { platform }) {
  if (platform === 'messenger') {
    return (
      <Messenger.ButtonTemplate
        buttons={
          <>
            <Messenger.PostbackButton title="🌭" payload="hotdog" />
            <Messenger.PostbackButton title="🌮" payload="taco" />
          </>
        }
      >
        Which one would you like?
      </Messenger.ButtonTemplate>
    );
  }

  return <p>Would you like <b>hotdog</b> or <b>taco</b>?</p>
}
```

The second argument is the environments while the component is being rendered. You can check which the `platform` property is and return the corresponding view.

Conventially at the end of the function, we can add a default cross-platform UI. This ensure the components is safe to be used on all the platforms.

## Expression Components

The separation of presentation is an important principle in application development, one example on back-end is the [MVC pattern](https://en.wikipedia.org/wiki/Model%E2%80%93view%E2%80%93controller). Thereby a view should contain only presentation logic, and all the presentation logic should be encapsulated in views.

It is recommended to wrap your expression within a root expression component (the View), and leave the event handler with only control flow logic (the Controller). So your handler might look tidy like this:

```js
app.onEvent(async ({ event, bot }) => {
  if (isFirstTime(event)) {
    return bot.render(event.channel, <Welcome />)
  }

  if (event.category === 'message') {
    if (event.type === 'text') {
      const intent = await recognizeIntent(event.text);

      if (intent === 'order') {
        bot.render(event.channel, <MakeOrder />);
      } else {
        bot.render(event.channel,<NonSupport intent={intent} />);
      }
    } else {
      bot.render(event.channel, <RandomMeme />);
    }
  } else {
    // ...
  }
});
```

## Next

By now you know about the core mechanism of Machinat for building CUI. Lean how to use more utilities with dependency injection in [next section](dependency-injection.md).
