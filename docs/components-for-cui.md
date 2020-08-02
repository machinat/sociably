# Components for CUI

Components make your code DRY and help you to build a complex, intelligent and characteristic conversational app.

## Why?

Mastering conversations is difficult! Think about a simple greeting, it might be far more complex than sending a `'Hi!'`. There are some considerations like:

- Bot should greet for the first time met or when user come back after leaving for a while.
- Choose the words depends on context like: current time, blessing for festivals, how much familiar or some more information about the user.
- Have some randomness like telling a joke sometimes.
- Continuing the topic from last conversation.
- Hello in multi-languages.

This is just merely a greeting. Such the issues might happen anywhere else in the conversations. That's why we need components to encapsulate these detailed conversational UI logic.

Components let you split the UI into independent, reusable pieces, and think about each piece in isolation.

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

The second argument is the circumstance while the component is being rendered. You can check which the `platform` property is and return the corresponding view.

The components then can be used without worrying the differences between platforms.

## Async Component (experimental)

_This feature is on experiment and the behavior might changed in the future._

Machinat also accepts async function as a component. This allow you to fetch necessary data to show the view while rendering.

Let's try say `Hello` according to how long the user have left:

```js
async function Hello({ firstTime, channel }) {
  if (firstTime) {
    return <p>Hello! Nice to meet you!</p>;
  }

  const {lastSeenAt} = await getStateFromDB(channel.uid);
  const hour = 60 * 60 * 1000;
  const now = Date.now();

  if (now - lastSeenAt < 8 * hour) {
    return null;
  }

  if (now - lastSeenAt > 72 * hour) {
    return <p>Welcome back!</p>;
  }

  return <p>Hi!👋</p>;
}
```

## Expression Components

The separation of presentation is an important principle in application development, one example on back-end is the [MVC pattern](https://en.wikipedia.org/wiki/Model%E2%80%93view%E2%80%93controller). Thereby a view should contain only presentation logic, and all the presentation logic should be encapsulated in views.

It is recommended to wrap your expression within a root expression component (the View), and leave the event handler with only control flow logic (the Controller). So your handler might look tidy like this:

```js
app.onEvent(async ({ event, bot, channel }) => {
  if (isFirstTime(event)) {
    return bot.render(channel, <Welcome />)
  }

  if (event.type === 'message') {
    if (event.subtype === 'text') {
      const intent = await recognizeIntent(event.text);

      if (intent === 'order') {
        bot.render(channel, <MakeOrder />);
      } else {
        bot.render(channel,<NonSupport intent={intent} />);
      }
    } else {
      bot.render(channel, <RandomMeme />);
    }
  } else {
    // ...
  }
});
```

## The Schema Pattern

The _schema_ describe here is not something like DB schema, it refers the concept of [_schema in psychology_](https://en.wikipedia.org/wiki/Schema_(psychology)). A schema is a pattern in human mind that organize the some categories of information inputs and make the behaviors output.

When you speak, a sequence of schemas are triggered to make the expression. They make the decisions from selecting the topics, making a metaphor, using grammars to picking a single word. This happens really fast while you speaking because human is good at language by nature.

Each component in Machinat can be considered as a schema focusing on some specific logic. Like the `Welcome`, `Hello` and `RecommendDailySpecial` example above, the expressions are then made with these nested schemas.

Components provide a way to build the CUI with the mechanism you already master! Before real strong AIs come out, this could be the way to approach the human-like conversational UI/UX.

If you are interested about the theory behind, check [Cognitive Linguistics](https://en.wikipedia.org/wiki/Cognitive_linguistics) and [Construction Grammar](https://en.wikipedia.org/wiki/Construction_grammar) for more information.


## Next
