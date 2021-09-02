---
title: Reactive Programming
---

While your app grows and ships more features, how to organize all the utilities would become a problem. Since the rendering mechanism handles only UI logic, an additional control flow library is required to handle business logic.

Machinat is flexible enough to integrate with any flow model. But among all of them, [_Reactive Programming_](https://en.wikipedia.org/wiki/Reactive_programming) might fit the conversational UI/UX the best.

Reactive programming is a declarative programming paradigm to handle asynchronous workflows in data streams. [@andrestaltz](https://twitter.com/andrestaltz) have a [great article](https://gist.github.com/staltz/868e7e9bc2a7b8c1f754) introducing the concept of reactive programming using [_Rx_](https://reactivex.io/), you can check it if the idea is pretty fresh to you.

## Machinat Stream Package

`@machinat/stream` implement the reactive programming paradigm with the optimization for conversational UI/UX.
A conversation can be treated as a stream of messages, and our app can handle chat streams reactively with the utilities.

:::warning
The package is still on early experimental. There might be breaking changes in the future for supporting cluster. Please consider that if you plan to use it on production.
:::

### Install

Install the `@machinat/stream` package with:

```bash
npm install @machinat/stream
# or with yarn
yarn add @machinat/stream
```

## Usage

### Root Stream From App

To create a stream from a Machinat app, use `fromApp` helper:

```js
import Machinat from '@machinat/core';
import { fromApp } from '@machinat/stream';

const app = Machinat.createApp({...});

const event$ = fromApp(app);
```

The `event$` stream will includes all events you would originally receive from `app.onEvent()`.

:::tip
The variable name with a trailing `$` is a naming convention for a stream in reactive programming.
:::

### Listen to a Stream

`stream.subscribe(listener, errorHandler?)` can be used to listen events flow through the stream. The listener function receive the event contexts like this:

```js
event$.subscribe(async ({ event, reply }) => {
  await reply('Hello!');
});
```

It can also take a service container like:

```js
event$.subscribe(
  makeContainer({ deps: [Machinat.Profiler] })(
    (profiler) =>
      async ({ event, reply }) => {
        const profile = await profiler.getUserProfile(event.user);
        await reply(<p>Hello {profile ? profile.name : 'there'}!</p>);
      }
  )
);
```

### Pipe to a New Stream

`stream.pipe(...operators)` pipes the stream through a series of operators and returns a new stream. This help us modularize the workflow of app by splitting it into several streaming operations. Following are some commonly used operators:

### Filter a Stream

The `filter` operator take a predicator function of type `(eventContext) => boolean`, like `Array.prototype.filter`. The event is pass to the next stream only when predicator return truthy.

With `filter`, we can separate the stream by different business logic. So the event handlers can also be separated in a modular way. For example:

```js
import { filter } from '@machinat/stream/operators';

event$
  .pipe(filter(({ platform }) => platform === 'webview'))
  .subscribe(handleWebviewAction);

event$
  .pipe(filter(({ event }) => event.category === 'message'))
  .subscribe(handleMessage);
```

### Map a Stream

THe `map` operator take a transformer function of type `(eventContext) => newContext`, like `Array.prototype.map`. The new context will be pass down to the stream.

It useful to doing pretreatment jobs and attach the result onto the context. For example:

```js
import { makeContainer } from '@machinat/core/service';
import IntentRecognizer from '@machinat/core/base/IntentRecognizer';
import { map } from '@machinat/stream/operators';

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

In the codes above, we use a service container of the transformer function for `map`. Most function parameters pass to the official operators can be switched to the service container of the function. 

### Execute a Side Effect

The `tap` operator take a side effect operator function and pass down the original context after finished. The difference between `stream.subscribe(operator)` is that the execution of `tap` is promised to be one by one within the chat scope.

```js
import { makeContainer } from '@machinat/core/service';
import StateController from '@machinat/core/base/StateController';
import { tap } from '@machinat/stream/operators';

event$.pipe(
  tap(
    makeContainer({ deps: [StateController] })(
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

### Merge Streams

```js
import { merge } from '@machinat/stream';

const webviewAction$ = 
```

## Designs and Road Map

:::info
The features mentioned in this section are designs for the future. They are only partially supported in single process scope for the current version. 
:::

Most reactive programming library are design for the client-side app like web front-end or mobile app. But server-side based apps like chatbots, should be [stateless](https://12factor.net/processes), [multi-process friendly](https://12factor.net/concurrency) and [disposable](https://12factor.net/disposability). To achieve these requirements on production, the stream must match the following requirements:

#### Persistence

Many of the Rx stream operators like `count` are stateful, the states must be stored in the persistent data service like database. This enable the state to be recovered when a process is created due to scaling or recovery from error.

```js
// the last seen time have to be persistent
const seenAt$ = event$.pipe(count(() => new Date()));
```

#### Concurrency

No matter how many processes or machines are serving the app, the stream operators should work identically as running on one process. This means the stateful operations should be safe from race condition. 

```js
// event on every process/server should be counted
const msgCount$ = message$.pipe(count());
```

#### Ordering

The events should be proceeded in the same order as received while executing asynchronous jobs. This is difficult because events could be distributed to different processes.

```js
// mirroring the message in the receiving order
message$.pipe(
  map(someAsyncWork),
  map(async ({ bot, event }) => {
    await bot.render(event.channel, event.text + '!!!');
  })
);
```

#### Exactly Once

A event should be proceeded exactly once in the stream, not omitted and not duplicated. If a server is down unexpectedly, the unfinished events should be able to resume.

### The Solution

Streaming architectures is not new on back-end, they are widely used in data pipeline or handling long running tasks. Generally the whole architecture is formed by a series of service workers around a [Message Queue](https://en.wikipedia.org/wiki/Message_queue).

But development of applications need to handle many detailed UI/UX logic, and require frequent updating and releasing. You might not want to separate your app into a dozen microservices listening to jobs from broker.

So could there be a monolithic way to have a message queue powered reactive programming lib for building UI/UX? There is actually a prior art, the [_Kafka Stream_](https://kafka.apache.org/documentation/streams/) based on [_Apache Kafka_](https://kafka.apache.org/). The streaming operations are backed with external message queue to match the guarantees describe above.

### Now and Future Plan

The current version of `@machinat/stream` only guarantee the upper features in single process scope. To make it support a server cluster, the simple road map is:

1. Scales up streaming features and make sure them works for building conversational UI/UX. Guarantee only single process robustness.
2. Use a Kafka broker to guarantee streaming feature works across processes and machines. There might be breaking changes while migrating.
3. Support more broker/queue providers as the underlying infrastructure.
