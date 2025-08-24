# State Memory Module

This module implements the [`BaseMemoryRepository`](https://sociably.js.org/api/modules/core_base_memoryrepository.html)
interface using an existing state repository as the underlying storage.

## Install

```bash
npm install @sociably/core @sociably/state-memory
# or with yarn
yarn add @sociably/core @sociably/state-memory
```

## Docs

Check the [Using Memory](https://sociably.js.org/docs/using-memory)
document and the [package reference](https://sociably.js.org/api/modules/state_memory.html).

## Setup

```js
import Sociably from '@sociably/core';
import StateMemory from '@sociably/state-memory';
import { InMemoryState } from '@sociably/dev-tools'; // or any other state repository

const app = Sociably.createApp({
  modules: [
    InMemoryState.initModule(), // or any other state repository
    StateMemory.initModule(),
  ],
});
```

## Usage

The StateMemory module provides a memory repository that stores data using your configured state repository.
It automatically generates unique IDs for stored items and provides methods to add, get, update, and delete memory data.

```js
const memory = app.useService(StateMemory.Repository);

// Get memory accessor for an agent
const agentMemory = memory.agentMemory(agent);

// Add an item and get generated ID
const itemId = await agentMemory.add('messages', {
  text: 'Hello',
  timestamp: Date.now(),
});

// Get an item by ID
const item = await agentMemory.get('messages', itemId);

// Update an item with partial changes
await agentMemory.update('messages', itemId, {
  text: 'Hello World',
});

// Get all items in a resource
const allMessages = await agentMemory.getAll('messages');

// Delete an item
await agentMemory.delete('messages', itemId);
```

## Features

- **Auto-generated IDs**: Automatically generates unique IDs using nanoid
- **Partial Updates**: Update items using partial changes, undefined values are filtered out
- **Multiple Scopes**: Supports agent, thread, user, and global memory scopes
- **State Repository Integration**: Uses your existing state repository as storage backend
- **Type Safety**: Full TypeScript support with generic types
