# Using State

Conversation is contextual, it's a process of interactions across a period of time. During the conversation proceed, a chatbot needs the state of the conversation/user in order to:

- know about basic information, favor or other knowledge of the user.
- remember topic and stop point of the conversation in order to continue later.
- store necessary data to provide more features.

## State Module

To enable state in Machinat add one state storage module from `@machinat/state`:

```js
import FileState from '@machinat/state/file';

Machinat.createApp({
  modules: [
    FileState.initModule({ path: './.state_storage' })
  ],
  ...
})
```

For now there are three storage types supported: `inMemory`, `file` and `redis`, check the module docs for more details.

## Use the State

All state modules provide the `Base.StateControllerI` interface, you can
use it without worrying which storage is it. Let's get the conversation state in a container:

```js
import { StateControllerI } from '@machinat/core/base';

app.onEvent(
  container({ deps: [StateControllerI] })(
    stateController => async context => {
      const { channel, bot } = context;

      const bookmarks = await stateController
        .channelState(channel)
        .get('bookmarks');

      if (bookmarks) {
        await bot.render(
          channel,
          `You have unread bookmarks:\n${bookmarks.join('\n')}`
        );
      } else {
        await bot.render(
          channel,
          "You have no bookmark saved yet."
        );
      }
    };
  );
);
```

The `#channelState()` method returns a state accessor of a channel, which typically refer to a chat thread. `#get(key)` returns a promise of state value on a specific key, it resolve `undefined` if no value have been saved.

To set state use the `#set(key, updater)` method:

```js
app.onEvent(
  container({ deps: [StateControllerI] })(
    stateController => async context => {
      const { channel, bot, event } = context;

      let matched;
      if (
        event.text &&
        (matched = event.text.match(/^Add (.*)$/i))
      ) {
        const newBookmark = matched[1];

        await stateController
          .channelState(channel)
          .set(
            'bookmarks',
            bookmarks => bookmarks
              ? [...bookmarks, newBookmark]
              : [newBookmark]
          )

        await bot.render(
          channel,
          `New bookmark "${newBookmark}" added.`
        );
      }
      // ...
    };
  );
);
```

`#set()` takes a key and an updater function which receives the current state value and returns the new value. If no value have been set before, the updater function would receive `undefined`. And if the updater function returns `undefined`, the state of key will be deleted.

### User State

User state might have different usage scope to channel state, since a user might show up in different chat rooms.

To use state on an user instead of a channel, use `#userState()` method:

```js
app.onEvent(
  container({ deps: [StateControllerI] })(
    stateController => async context => {
      const { user, channel, bot, event } = context;

      let matched;
      if (
        event.text &&
        (matched = event.text.match(/^Call me (.*)$/i))
      ) {
        const nickname = matched[1];

        await stateController
          .userState(user)
          .set('nickname', () => nickname);

        await bot.render(channel, `OK ${nickname}!`);
      } else {
        const nickname = await stateController
          .userState(user)
          .get('nickname');

        await bot.render(
          channel,
          nickname
            ? `Hi ${nickname}!`
            : 'What should I call you?'
        );
      }
    };
  );
);
```

The state accessor usage is exactly the same with channel state.

### Global State

In case you want to use state in the whole app scope, use `#globalState()`:

```js
const favorOfAll = await stateController
  .globalState('poll')
  .get('pizza_or_hotdog');
```

For example each `AssetManager` of official platform modules stores the assets id mapping in global state.
