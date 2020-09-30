# Using State

While having a conversation, knowing about the context is the key for proceeding the topic. A chatbot may needs the state of the conversation in order to remember:

- the current topic of the conversation for continuing.
- user answer/choices/behavior to know more about the user.
- which information have been said/notified for not being duplicated.

## Install State Module

To enable state in Machinat, you can start with `FileState` or `InMemoryState` from the `@machinat/simple-state` package:

```js
import { FileState } from '@machinat/simple-state';

Machinat.createApp({
  modules: [
    FileState.initModule({ path: './.state_storage' })
  ],
  ...
})
```

For now the modules listed below with different kinds of storage are officially supported, please check the package readme for more details.

- [`@machinat/simple-state`](/packages/machinat-simple-state): provide `FileState` and `InMemoryState` for testing purposes, using in production environment is not recommended.
- [`@machinat/redis-state`](/packages/machinat-redis-state): save and load state with [Redis](https://redis.io/) in-memory database.

## Use the State

All state modules provide the `Base.StateControllerI` interface, you can use it without worrying which storage is it. Let's try getting the conversation state in a container:

```js
import { StateControllerI } from '@machinat/core/base';

app.onEvent(
  container({ deps: [StateControllerI] })(
    stateController => async ({ event, bot }) => {
      const bookmarks = await stateController
        .channelState(event.channel)
        .get('bookmarks');

      if (bookmarks) {
        await bot.render(
          event.channel,
          `You have unread bookmarks:\n${bookmarks.join('\n')}`
        );
      } else {
        await bot.render(
          event.channel,
          "You have no bookmark saved yet."
        );
      }
    };
  );
);
```

The `#channelState(channel)` method returns a state accessor of a channel, which typically refer to a chat thread. `#get(key)` returns a promise of state value on a specific key, it resolve `undefined` if no value have been saved.

To set state use the `#update(key, updater)` method:

```js
app.onEvent(
  container({ deps: [StateControllerI] })(
    stateController => async ({ bot, event } ) => {
      let matched;
      if (
        event.text &&
        (matched = event.text.match(/^Add (.*)$/i))
      ) {
        const newBookmark = matched[1];

        await stateController
          .channelState(event.channel)
          .update(
            'bookmarks',
            bookmarks => bookmarks
              ? [...bookmarks, newBookmark]
              : [newBookmark]
          )

        await bot.render(
          event.channel,
          `New bookmark "${newBookmark}" added.`
        );
      }
      // ...
    };
  );
);
```

`#update()` takes a key and an updater function which receives the current state value and returns the new value. If no value have been set before, the updater function would receive `undefined`. And if the updater function returns `undefined`, the state of key will be deleted.

### User State

Sometime you might want to save the state of the user instead of channel. User state have different usage scope to channel state, since a user can show up in many chatrooms.

To use state on an user instead of a channel, use `#userState(user)` method:

```js
app.onEvent(
  container({ deps: [StateControllerI] })(
    stateController => async ({ bot, event }) => {
      let matched;
      if (
        event.text &&
        (matched = event.text.match(/^Call me (.*)$/i))
      ) {
        const nickname = matched[1];

        await stateController
          .userState(event.user)
          .update('nickname', () => nickname);

        await bot.render(event.channel, `OK ${nickname}!`);
      } else {
        const nickname = await stateController
          .userState(event.user)
          .get('nickname');

        await bot.render(
          event.channel,
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

For example, the `AssetsManager` service of each platform stores the assets id mapping in global state.

## Next

Learn how to make more complex dialog flow in [next section](staged-dialog.md)
