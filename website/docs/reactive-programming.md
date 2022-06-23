---
title: Reactive Programming
---

Reactive programming is a declarative programming paradigm that handles asynchronous workflows in data streams.
If the idea is fresh to you, [@andrestaltz](https://twitter.com/andrestaltz)
has a [great article](https://gist.github.com/staltz/868e7e9bc2a7b8c1f754) introducing the concept using [_Rx_](https://reactivex.io/).

The reactive paradigm naturally suits a sociable app which listens to events from chat platforms reactively.
It's our recommended way to control the business logic flow.

## Sociably Stream Package

`@sociably/stream` implements the reactive programming utilities that are optimized for sociable apps.
The most important specialty is: All the events on a chat are processed in a strict order in the stream.

### Install

Install the `@sociably/stream` package with:

```bash
npm install @sociably/stream
```

## Usage

### Root Stream From App

Use `fromApp` helper to create a stream from a Sociably app:

```js
import Sociably from '@sociably/core';
import { fromApp } from '@sociably/stream';

const app = Sociably.createApp({...});

const event$ = fromApp(app);
```

The `event$` stream will include all events you would receive at `app.onEvent()`.

:::tip
The variable name with a trailing `$` is a naming convention for a stream in reactive programming.
:::

### Listen to a Stream

`stream.subscribe(listener, errorHandler?)` method listens to events on a stream.
The listener function would receive the event context object.
Like:

```js
event$.subscribe(async ({ event, reply }) => {
  await reply(`Hello ${event.text}`);
});
```

It can also take a service container as the listener.
Like:

```js
import Sociably, { BasicProfiler } from '@sociably/core';

event$.subscribe(
  makeContainer({ deps: [BasicProfiler] })(
    (profiler) =>
    async ({ event, reply }) => {
      const profile = await profiler.getUserProfile(event.user);
      await reply(<p>Hello {profile?.name || 'there'}!</p>);
    }
  )
);
```

### Pipe to a New Stream

`stream.pipe(...operators)` method pipes the stream through a series of operators that output a new stream.
Through it we can split the business logic into working flows,
which helps us to build the app in a declarative and modular way.

We'll introduce some commonly used operators below.

### Filter a Stream

`filter(predicator)` operator filters the stream like `Array.filter`.

It takes a predicator function with `(eventContext) => boolean` type.
The event is passed to the next stream only when the predicator returnstrue`.

We can use it to extract a fraction of events so they can be handled separately.
For example:

```js
import { filter } from '@sociably/stream/operators';

event$
  .pipe(filter((ctx) => ctx.platform === 'webview'))
  .subscribe(handleWebview);

event$
  .pipe(filter((ctx) => ctx.event.category === 'message'))
  .subscribe(handleMessage);
```

### Map a Stream

`map(transformer)` operator shapes the events in the stream like `Array.map`.

It takes a transformer function with `(eventContext) => newContext` type.
The new event context will be passed to the next stream.

We can use it to execute a job and attach the result onto the context. 
For example:

```js
import { makeContainer, IntentRecognizer } from '@sociably/core';
import { map } from '@sociably/stream/operators';

const eventWithIntent$ = event$.pipe(
  map(
    makeContainer({ deps: [IntentRecognizer] })(
      (recognizer) =>
      async (context) => {
        const { event } = context;
        let intent = null;

        if (event.type === 'text') {
          intent = await recognizer.detectText(event.channel, event.text);
        }
        
        return { ...context, intent };
      }
    )
  )
);
```

### Execute a Side Effect

`tap(effectFn)` operator executes a job and then passes the original context down when it's finished.
 
The difference from `stream.subscribe(operator)` is that `tap` guarantees the execution order is one-by-one under a chat.

```js
import Sociably, { makeContainer, StateController } from '@sociably/core';
import { tap } from '@sociably/stream/operators';

event$.pipe(
  tap(
    makeContainer({
      deps: [StateController],
    })(
      (stateController) =>
      async ({ event, reply }) => {
        const count = stateController
          .channelState(event.channel)
          .update((curCount = 0) => curCount + 1);

        await reply(<p>Hello #{count}!</p>);
      }
    )
  )
);
```

### Use Asynchronized Container

The operators can take an _asyncronized_ function as the callback.
As stated, all the async jobs under a chat are executed in a strict order.

They also accept a [service container](dependency-injection.md#service-container)
of the callback function.
As the examples above, you can require services to handle business logic.

### Merge Streams

`merge(...streams)` merge multiple streams into one.

```js
import { merge } from '@sociably/stream';

const greeting$ = merge(webviewGreeting$, chatGreeting$);
```

## Constraints and Road Map

Currently the execution order is only guaranteed on a single server.
If you are running the app on a cluster,
the events under a chat may go to different servers and break the order.

To fix this, it requires an external broker to distribute the jobs and guarantee the order.
But there are some major challenges to overcome: 

#### Persistence

Many of the Rx stream operators like `count` are stateful. 
The stream state have be stored in the database,
so it can be recovered when the server restarts.

```js
// the status of count have to be persistent
const msgCount$ = message$.pipe(count());
```

#### Concurrency

On every process and machine,
the streams and operators should work identically.
This means the stateful operations should be safe from race conditions. 

```js
// every process should see the identical count
const msgCount$ = message$.pipe(count());
```

#### Ordering

The events should be processed in the same order as they are received,
even when executing asynchronous jobs.
This is difficult because events could be sent to different processes.

```js
// the mirrored messages should always be in the same order
message$.pipe(
  map(someAsyncWork),
  map(async ({ reply, event }) =>
    reply(event.text + '!!!')
  )
);
```

#### Exactly Once

An event should be processed exactly once in the stream,
not being omitted or duplicated.
If a server is down unexpectedly,
the unfinished events should be able to resume.

### Road Map

[_Kafka Stream_](https://kafka.apache.org/documentation/streams/) is a previous art that implements the reactive stream for server-based programs.
It's built upon [_Apache Kafka_](https://kafka.apache.org/) to provide the guarantees mentioned above.

In the future, we'll make a similar solution in JavaScript which is based on Kafka or other brokers.
It'll be optimized for conversational apps, and could possibly support all the server-based programs.
