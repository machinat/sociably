# Postgres State Module

This module implement the [`BaseStateController`](https://sociably.js.org/api/modules/core_base_statecontroller.html)
interface with PostgreSQL database.

## Install

```bash
npm install @sociably/core @sociably/postgres-state
# or with yarn
yarn add @sociably/core @sociably/postgres-state
```

## Docs

Check the [Using State](https://sociably.js.org/docs/using-states)
document and the [package reference](https://sociably.js.org/api/modules/postgres_state.html).

## Setup

```js
import Sociably from '@sociably/core';
import PostgresState from '@sociably/postgres-state';

const app = Sociably.createApp({
  modules: [
    PostgresState.initModule({
      connectOptions: {
        host: 'localhost',
        port: 5432,
      },
    }),
  ],
});
```
