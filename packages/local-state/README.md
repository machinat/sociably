# Local State Module

This module implement the [`BaseStateController`](https://machinat.com/api/modules/core_base_statecontroller.html)
with in-memory and file storage. We suggest to use them for testing purpose only.

## Install

```bash
npm install @machinat/core @machinat/local-state
# or with yarn
yarn add @machinat/core @machinat/local-state
```

## Docs

Check the [Using State](https://machinat.com/docs/using-states) document for the
usage guide, and the [package reference](https://machinat.com/api/modules/local_state.html)
for API details.

## Setup

#### In-Memory State

```js
import Machinat from '@machinat/core';
import { InMemoryState } from '@machinat/local-state';

const app = Machinat.createApp({
  modules: [
    InMemoryState.initModule(),
  ],
});
```

#### In-Memory State

```js
import Machinat from '@machinat/core';
import { FileState } from '@machinat/local-state';
import YAML from 'yaml';

const app = Machinat.createApp({
  modules: [
    FileState.initModule({
      path: './.state_storage.json',
    }),
  ],
  services: [
    // you can swap the serializer
    { provide: FileState.Serializer, withValue: YAML }
  ],
});
```
