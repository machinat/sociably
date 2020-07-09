# Reactive Programming

We have introduced powerful utilities Machinat have shipped, now it's time to glue them together. Consider a simplest chat app with a workflow like this:

!()[]

Here we need a model to handle such sequences of asynchronous jobs and conditional branches in the _back-end_.

## Handling Events as Stream

Reactive programming is a declarative programming paradigm to handle asynchronous workflows in data streams. That sounds exactly what we need!

If you come from front-end world, you might have heard [_Rx_](http://reactivex.io/) before. [@andrestaltz](https://twitter.com/andrestaltz) have a [great article](https://gist.github.com/staltz/868e7e9bc2a7b8c1f754) introducing reactive programming using _Rx_, you should check it if the idea is pretty fresh to you.

The workflow above described in functional reactive programming may look like:

```js
const [postback$, textMsg$, unknownMsg$] = events$.conditions([
  isPostback,
  isText,
  () => true,
]);

const intent$ = textMsg$.map(recognizeIntent);

const operation$ = merge(
  postback$
    .map(getOperationFromPostback),
  intent$
    .filter(isOperation)
    .map(getOperationFromIntent)
);
operation$
  .map(executeOperation)
  .map(replyResult);

merge(
  unknownMsg$,
  intent$.filter(not(isOperation))
).map(perfunctory);
```

initiate


throttle

## Challenges on Back-end

Unfortunately most popular reactive programming frameworks have some problems to be directly used on the back-end. Different from front-end, a modern back-end based app is expected to be [stateless](https://12factor.net/processes), [multi-process friendly](https://12factor.net/concurrency) and [disposable](https://12factor.net/disposability). To make a event streaming framework


### Persistence

Many of the stream operators are stateful like `scan`, these states must be stored in the persistent data service like database. The state should be recovered if a process is created due to scaling or recovery from error.

```js
// the last seen time should be persistent
const lastSeenAt$ = chatroom$.scan(() => new Date())
```

### Concurrency

The stateful operations should be safe from race condition. It should works identically while being accessed from different process or machine.

```js
// event on every server should be counted
const msgCount$ = message$.count();
```

### Order

The events should be proceeded in the strictly same order as received while executing asynchronous jobs. This is difficult because continuous events could be dispatched to different servers.

```js
// mirror the message in the receiving order
message$
  .map(someAsyncWork)
  .map(async ({ bot, channel, event }) => {
    await bot.render(channel, event.text + '!!!');
  });
```

### Exactly Once

A event should be proceeded exactly once, not omitted and not duplicated. If a server unexpectedly down, the unfinished events should be able to resume.

```js

```


##

A back-end developer might might have already found out that the features we listed above can be supported by a message queue. Events driven streaming architecture is not a new face on back-end, but now we need it to solve a new problem: application logic for end users.

Unlike data pipeline and and business logic, application may have more details, more branches and more frequent releases. You might prefer describing your app like this:

```js
events$
  .filter(isFromMessenger)
  .map(doSomeAsyncWorks)
  .map(async ({ bot, channel }) => {
    await bot.render(
      channel,
      `Hello, traveler from Messenger!`
    );
  });
```

instead of separating them into several micro-services.

## Plan

Could there be a declarative way to have a message queue powered reactive programming lib? There is actually a prior art on Java, the [_Kafka Stream_](https://kafka.apache.org/documentation/streams/) based on [_Apache Kafka_](https://kafka.apache.org/).

The next big goal of Machinat is a message queue backed reactive programming library for back-end. We wish to have an Node.js implementation, and support some Machinat utilities like service container over it. A rough roadmap is:

1. Provide a single point viable API work without the message broker in 0.X. Able to be used without multi-process and error recovery guarantees.
2. Backed with an external message broker in 1.0 beta with all the guarantees a message queue should have.
3. Support more utilities like dashboard/logger for streams, multiple broker type supporting, DevOps automation, etc.
