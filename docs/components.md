# Components

> Components let you split the UI into independent, reusable pieces, and think about each piece in isolation.
> —— reactjs.org

The above description about component is from [React.js](https://reactjs.org/docs/components-and-props.html), and it should ............ building CUI.

Think about a simple greeting, to say hi like a real human is far more complex than sending a `'Hi!'`. There might be considerations like:

- Bot should greet for the first time met or when user come back after leaving for a while.
- Choose the words depends on the current time, how much familiar or some external information like the weather outside.
- More advanced issues like multi-language, tell something interesting randomly or continuing the topic from last conversation.

Though your bot don't have to be polite, but these are the issues you might have while building any part of chat experiences. That's why you need components to modulize CUI in a chat app like things you do to build a graphical app.

## Functional Components

A component is simply a javascript function:

```js
function Greeting(props) {
  return <p>Hello {props.name}!</p>
}
```

The component take the first argument as props object set on the element, and it should return an element or pure text. Then you can use it in the message:

```js
bot.render(channel, <Greeting name="Jojo" />);
```

## Cross Platform

If you want to use native features in a cross-platform bot, you might have codes like this:

```js
import * as Messenger from '@machinat/messenger/components';

app.onEvent(async ({ platform, bot, channel }) => {
  if (platform === 'messenger') {
    await bot.render(
      channel,
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
  } else {
    await bot.render(
      channel,
      <>Would you like <b>hotdog</b> or <b>taco</b>?</>
    );
  }
});
```

To reuse the cross-platform logic in different part of chat flow, this can be extract into a component:

```js
function AskForOrder({ isVegetarian }, { platform }) {
  if (isVegetarian) {
    return 'We have fresh 🥗!'
  }

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

  return <>Would you like <b>hotdog</b> or <b>taco</b>?</>
}
```

The second argument is the circumstance while the component is being rendered. Check which the `platform` is and return the corresponded native components like above. The component then can be used as _cross-plarform_:

```js
bot.render(channel, <AskForOrder isVegetarian={false}/>)
```

Now you can use the _view_ everywhere in your chat flow without worrying platform differences.

## Async Functional Component

Machinat also accepts async function as a component, this allow you to fetch necessary data to show the view while rendering.

..........

```js
async function Notification({ time, location }) {
  let additionalReminding = null;
  if (location === 'outdoor') {
    const weather = await fetchWeatherToday();

    if (weather === 'rainy') {
      additionalReminding = "Don't forget 🌂.";
    }
  }

  return (
    <p>
      You have a event at {time}
      <br/>
      {additionalReminding}
    </p>
  );
}
```



## Cognition and Construction

Machinat is more or less inspired by [Cognitive Linguistics](https://en.wikipedia.org/wiki/Cognitive_linguistics) especially the concept of [Construction Grammar](https://en.wikipedia.org/wiki/Construction_grammar).
