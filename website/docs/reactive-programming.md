---
title: Reactive Programming
---

# Reactive Programming

While your app grows and ships more features, how to organize all the utilities would become a problem. Since the rendering mechanism handles only UI logic, an additional control flow library is required to handle business logic.

Machinat is flexible enough to integrate with any flow model. But among all of them, [_Reactive Programming_](https://en.wikipedia.org/wiki/Reactive_programming) might fit the conversational UI/UX the best.

Reactive programming is a declarative programming paradigm to handle asynchronous workflows in data streams. [@andrestaltz](https://twitter.com/andrestaltz) have a [great article](https://gist.github.com/staltz/868e7e9bc2a7b8c1f754) introducing the concept of reactive programming using [_Rx_](https://reactivex.io/), you should check it if the idea is pretty fresh to you.

### Handling Events as Stream

A conversation can be treated as a stream, where expressions between people flows in a period of time. So reactive programming can naturally handle the conversation behavior and the the derived asynchronous tasks well.

For example, continuous messages in a moment should be treated as one. In a callback style model, this require some additional works. But in reactive programming, this can be solved with a simple streaming operator like `Buffer`.

![buffer operator](https://reactivex.io/documentation/operators/images/Buffer.png)

> _Buffer Stream Operator -- image from [reactivex.io](https://reactivex.io/documentation/operators/buffer.html)_


## X-Machinat

`X-Machinat` is an extensional library to experiment reactive programming with conversational UI/UX. Consider an application flow for simple CRUD actions like:

![Example App Control Flow](./assets/example-app-control-flow.png)

It can be described in a reactive programming way like this:

```js
import { fromApp, conditions, merge } from 'x-machinat';
import { map, filter } from 'x-machinat/operators';

const event$ = fromApp(app);

const [postback$, textMsg$, unknownMsg$] = conditions(events$, [
  isPostback,
  isText,
  () => true,
]);

const intendedMsg$ = textMsg$.pipe(map(recognizeIntent));

const action$ = merge(
  postback$.pipe(
    map(actionFromPostback)
  ),
  intendedMsg$.pipe(
    filter(isAction),
    map(actionFromIntent)
  )
);

action$.pipe(
  map(executeAction),
  map(replyResult)
);

merge(
  unknownMsg$,
  intendedMsg$.filter(not(isAction))
).pipe(map(replyRandomEmoji));
```

Now the control flow can be describe as a declarative pipeline instead of imperative code.

### Challenges on Back-end

The package is still on experiment because there are still some challenges to overcome. Different from front-end, a modern back-end based app is expected to be [stateless](https://12factor.net/processes), [multi-process friendly](https://12factor.net/concurrency) and [disposable](https://12factor.net/disposability). To achieve these on production, the stream must match the following requirements:

#### Persistence

Many of the stream operators are stateful like [`scan`](https://reactivex.io/documentation/operators/scan.html), these states must be stored in the persistent data service like database. The state should be recovered when a process is created due to scaling or recovery from error.

```js
// the last seen time should be persistent
const seenAt$ = chatroom$.pipe(scan(() => new Date()));
```

#### Concurrency

The stateful operations should be safe from race condition. It should works identically while being accessed from different process or machine.

```js
// event on every server should be counted
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

A event should be proceeded exactly once in the stream, not omitted and not duplicated. If a server is unexpectedly down, the unfinished events should be able to resume.

## The Solution

Streaming architectures is not new on back-end, they are widely used in data pipeline or handling long running tasks. Generally the whole architecture is formed by a series of service workers around a [Message Queue](https://en.wikipedia.org/wiki/Message_queue).

But development of applications need to handle many detailed UI/UX logic, and require frequent updating and releasing. You might not want to separate your app into a dozen microservices listening to jobs from broker.

So could there be a monolithic way to have a message queue powered reactive programming lib for building UI/UX? There is actually a prior art on Java, the [_Kafka Stream_](https://kafka.apache.org/documentation/streams/) based on [_Apache Kafka_](https://kafka.apache.org/). The streaming operations are backed with external message queue to match the guarantees describe above.

## Our Plan

_X-Machinat_ aims to provide message queue backed reactive programming control flow for Machinat apps. And hopefully the streaming utilities can be extracted out as an independent library for general purpose.

If you are interested, check the package [readme](https://github.com/machinat/x-machinat) for the usage and development schedule.
