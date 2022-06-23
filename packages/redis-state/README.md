# Redis State Module

This module implement the [`BaseStateController`](https://sociably.js.org/api/modules/core_base_statecontroller.html)
interface with redis in-memory database.

## Install

```bash
npm install @sociably/core @sociably/redis-state
# or with yarn
yarn add @sociably/core @sociably/redis-state
```

## Docs

Check the [Using State](https://sociably.js.org/docs/using-states)
document and the [package reference](https://sociably.js.org/api/modules/redis_state.html).

## Setup

```js
import Sociably from '@sociably/core';
import RedisState from '@sociably/redis-state';

const app = Sociably.createApp({
  modules: [
    RedisState.initModule({
      clientOptions: {
        host: 'localhost',
        port: 6379,
      },
    }),
  ],
});
```
