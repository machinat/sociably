---
title: Using State
---

A sociable app itself is a stateless server.
So we need to keep the info of a chat/user in persistent storage.
Therefore the bot can use the state data to provide services and better experiences.

## Install State Module

In development, it's recommended to use `FileState` for easy debugging.
But in production, you need to switch to other production-ready implementation,
like `RedisState`.

You can register the state module like this:

```js
import { FileState } from '@machinat/dev-tools';
import RedisState from '@machinat/redis-state';

const { NODE_ENV, REDIS_URL } = process.env;
const DEV = NODE_ENV !== 'production';

Machinat.createApp({
  modules: [
    DEV
      ? FileState.initModule({
          path: './.state_data.json',
        })
      : RedisState.initModule({
          clientOptions: {
            url: REDIS_URL,
          },
        }),
    //...
  ],
  //...
})
```

For now the following state modules are officially supported,
please check the references for more details:

- [`@machinat/dev-tools`](pathname:///api/modules/dev_tools): provide `FileState` and `InMemoryState` for testing and debugging. Don't use them in production.
- [`@machinat/redis-state`](pathname:///api/modules/redis_state): save and load state in [Redis](https://redis.io/) database.

## Get Chat State

Once you set the state provider up,
you can use the `StateController` service to access the state.
For example:

```js
import { makeContainer, StateController } from '@machinat/core';

app.onEvent(
  makeContainer({ deps: [StateController] })(
    (stateController) => async ({ event, reply }) => {
      const bookmarks = await stateController
        .channelState(event.channel)
        .get('bookmarks');

      if (bookmarks) {
        await reply(`You have unread bookmarks:\n${bookmarks.join('\n')}`);
      } else {
        await reply('You have no saved bookmark');
      }
    };
  );
);
```

`controller.channelState(channel)` method returns an accessor to the chat state.
The state data is stored in key-value pairs, like a JavaScript `Map`.

`accessor.get(key)` resolves the value saved on a key.
If no value has been saved before, it resolves `undefined`.

## Update State

To set a state value, use the `accessor.update(key, updater)` method.
For example:

```js
app.onEvent(
  makeContainer({ deps: [StateController] })(
    (stateController) => async ({ event, reply } ) => {
      if (event.type === 'text') {
        const matchAdding = event.text.match(/^add (.*)$/i);

        if (matchAdding) {
          const newBookmark = matchAdding[1];
  
          const bookmarks = await stateController
            .channelState(event.channel)
            .update(
              'bookmarks',
              (currentBookmarks = []) =>
                [...currentBookmarks, newBookmark]
            );
          await reply(`You have ${bookmarks.length} bookmarks.`);
        }
      }
      // ...
    };
  );
);
```

`update` takes a key and an updater function,
which receives the current value and returns the new value.
The returned value is then saved into the storage.

This mechanism makes it easy to update an array or object state value.

#### `undefined` Means Empty

If no value has been saved, the updater receives an `undefined` value.
And if the updater returns `undefined`, the value on the key will be deleted.

We can use _default parameter_ to handle `undefined` value elegantly: 

```js
(currentBookmarks = []) =>
  [...currentBookmarks, newBookmark]
```

#### Cancel Updating

The new value is compared with the old value using `===`.
If the same value is returned, no saving action will be made.
For example, this updating call is NOT going to work:

```js
await stateController
  .channelState(event.channel)
  .update('my_data', (data) => {
    data.foo = 'bar';
    return data; // the value is the same object
  });
```

_So do not mutate the value in the updater. Always return a new one._

### User State

Sometimes you might want to use the user state instead of chat state.
Their scopes are different  since a user can show up in many chatrooms.

To access the user state, use the `controller.userState(user)` method.
For example:

```js
app.onEvent(
  makeContainer({ deps: [StateController] })(
    (stateController) => async ({ event, reply }) => {
      if (event.type === 'text') {
        const matchCallMe = event.text.match(/^call me (.*)$/i);

        if (matchCallMe) {
          const nickname = matchCallMe[1];
          await stateController
            // highlight-next-line
            .userState(event.user)
            .update('nickname', () => nickname);
  
          return reply(`OK ${nickname}!`);
        }
      }

      const nickname = await stateController
        // highlight-next-line
        .userState(event.user)
        .get('nickname');
      await reply(nickname ? `Hi ${nickname}!` : 'What should I call you?');
    }
  );
);
```

The state accessor usage is exactly the same with channel state.

### Global State

If you want to use state at the global scope,
use `controller.globalState(name)`.
For example:

```js
const newYorkWeather = await stateController
  .globalState('weathers')
  .get('new_york');
```
