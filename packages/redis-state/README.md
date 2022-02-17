# Redis State Module

This module implement the [`BaseStateController`](https://machinat.com/api/modules/core_base_statecontroller.html)
interface with redis in-memory database.

## Install

```bash
npm install @machinat/core @machinat/redis-state
# or with yarn
yarn add @machinat/core @machinat/redis-state
```

## Docs

Check the [Using State](https://machinat.com/docs/using-states)
document and the [package reference](https://machinat.com/api/modules/redis_state.html).

## Setup

```js
import Machinat from '@machinat/core';
import RedisState from '@machinat/redis-state';

const app = Machinat.createApp({
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
