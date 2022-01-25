---
title: Dependency Injection
---

To support many platforms and provide all the features, there have to be tons of services and the complex dependencies relationship between them. Machinat has a built-in [Inversion of Control](https://en.wikipedia.org/wiki/Inversion_of_control) system to help providing all the services and their dependencies.

When you create a Machinat app and start it, you actually create a set of service bindings then initiate some necessary starting processes.

```js
Machinat.createApp({
  platforms: [
    Messenger.initModule({ ... }),
    Line.initModule({ ... }),
  ],
  modules: [
    Http.initModule({ ... }),
  ],
  services: [
    MyService,
  ],
}).start();
```

### Services from Modules

The `modules` and `platforms` added in the app usually register a set of services. For example, `Messenger.Bot` class is registered with the `Messenger` platform in the example above. The bot instance is then created when `app.start()`.

Machinat provide most of features as services registered in the app. Please check the references of the modules/platforms for the usage.

## Require Services from App

Services can be required from app directly:

```js
import Machinat from '@machinat/core';
import Messenger from '@machinat/messenger';
import Line from '@machinat/line';

const app = Machinat.createApp({ ... });

app.start().then(() => {
  const [messengerBot, lineBot] = app.useServices([
    Messenger.Bot,
    Line.Bot,
  ]);
  // use the bots ...
});
```

Then `app.useServices()` accepts an array of interfaces and returns an array of service instances bound on them. You must call it after the app is successfully started, otherwise it throws.

## Service Container

Dependencies injection is a technique to allow injected code to receive its dependencies instead of creating its own.

In Machinat, this can be achieve by a **Service Container**. A Machinat container is simply a function annotated with the dependencies it required as the parameters.

```js
import { makeContainer } from '@machinat/core';

const fooBarContainer = makeContainer({
  deps: [FooI, BarI]
})((foo, bar) => {
  // do something with foo & bar ...
});
```

In the example above, the `makeContainer` helper annotate the `fooBarContainer` function needs two dependencies `FooI` and `BarI`. The `foo` and `bar` instances will be injected later into the container while running.

Machinat by default support dependencies injection for event/error handlers and components (experimental). It could also work in [`@machinat/script`](dialog-script.md) and [`@machinat/stream`](reactive-programming.md).

### Container Handler

The `app.onEvent` and `app.onError` methods can accept a container handler like this:

```js
import { makeContainer } from '@machinat/core';
import Messenger from '@machinat/messenger';

app.onEvent(
  makeContainer({ deps: [Messenger.Profiler] })(
    (profiler) => async ({ event, reply } ) => {
      const profile = await profiler.getUserProfile(event.user);

      await reply(`Hello ${profile ? profile.name : 'there'}!`)
    }
  )
);
```

The handler container above is a curried function receives a `Messenger.Profiler` and returns an ordinary handler function. It works just like the ordinary handler is being contained by a factory function.

When a event/error is popped, app would inject the container then call the returned handler immediately.

### Optional Requisition

By default an error would be throw if a unregistered dependency is being required. You can mark a requisition as optional to prevent this:

```js
makeContainer({
  deps: [{ require: FooService, optional: true }]
})((foo) => (ctx) => {
  // foo would be null if not registered
  if (foo) {
    // ...
  }
})
```

### Use Build-in Services

Machinat provides some commonly used services for making conversational apps. For example, to recognize intents, to fetch users' profile or to save/load state data. You can put them together in a chat like this:

```js
import { IntentRecognizer, BasicProfiler, StateController } from '@machinat/core';

app.onEvent(
  makeContainer({
    deps: [IntentRecognizer, BasicProfiler, StateController],
  })(
    (recognizer, profiler, stateController) => async context => {
      const { bot, event: { channel, user } } = context;

      if (event.type === 'text') {
        const intent = await recognizer.detectText(event.channel, event.text);

        if (intent.type === 'hello') {
          const profile = await profiler.getUserProfile(user);
          await bot.render(channel, `Hello ${profile?.name || 'there'}!`);

          await stateController
            .channelState(channel)
            .update('hello_count', (count = 0) => count + 1);
        }
      }
    }
  )
);
```

Here are the list of them, please check the references for more details:

- [`BasicBot`](pathname:///api/modules/core_base_bot): Send messages to a platform agnostic channel, so you don't have to require `Bot` implementation of each platform.
- [`BasicProfiler`](pathname:///api/modules/core_base_profiler): Fetch profile of a platform agnostic user, so you don't have to require `Profiler` implementation of each platform.
- [`StateController`](pathname:///api/modules/core_base_statecontroller): Save and load channel/user state from the storage. We'll introduce it more in the [Using State](using-states.md) doc.
- [`IntentRecognizer`](pathname:///api/modules/core_base_intentrecognizer): Recognize intent of a text message. We'll introduce it more in the [Recognizing Intent](recognizing-intent.md) doc.
- [`Marshaler`](pathname:///api/modules/core_base_marshaler): Marshal/unmarshal instances of the built-in classes, like users and channels, so they can be saved/loaded direclty while using `StateController`. You can also add your own data types.

### Register Services

Other than services from modules and platforms, you can register service individually with the `services` option:

```js
import MessengerAssetsManager from '@machinat/messenger/asset';
import FooService from './foo';

Machinat.createApp({
  platforms: [...],
  modules: [...],
  services: [
    MessengerAssetsManager,
    FooService,
  ],
})
```

The services then can be required via `app.useServices()` or by a container.

```js
const [foo, assets] = app.useServices([
  FooService,
  MessengerAssetsManager,
]);
// or
makeContainer({ deps: [FooService, MessengerAssetsManager] })(
  (foo, assetsManager) => ctx => {
    // ...
  }
)
```

## Providing Services

In spite of the official services, it is really easy to make a service provider from a JavaScript class.

Before register your own class in the app, you have to annotate the metadata about it:

```js
import { makeClassProvider } from '@machinat/core';
import BeerService from './beer';

class BarService {
  constructor(beerService) {
    this.beerService = beerService;
  }

  serve() {
    return this.beerService.pour();
  }
}

export default makeClassProvider({
  lifetime: 'singleton',
  deps: [BeerService],
})(BarService);
```

The `makeClassProvider(options)(constructor)` annotator is a curried function take the metadata options to annotate the following class constructor. `provider` take the following options:

- `lifetime` - required, the lifetime of the service within the app, one of `'singleton'`, `'scoped'` or `'transient'`. Check the [service lifetime](#service-lifetime) section for more details.
- `deps` - optional, the required dependencies of the provider, default to `[]`.
- `name` - optional, the name of provider, default to the name of the constructor.
- `factory` - optional, the factory function to create the provider instance, default to `(...deps) => new Klass(...deps)`.

Now you are able to register your service and use it:

```js
const app = Machinat.createApp({
  services: [BeerService, BarService],
});

const [bar] = app.useServices([BarService]);
bar.serve();
```

### Interface and Binding

Registering the provider class directly is actually a sugar to have a binding to itself as an interface. For example:

```js
Machinat.createApp({
  services: [MyService],
});
// is equivalent to
Machinat.crrateApp({
  services: [
    { provide: MyService, withProvider: MyService },
  ],
});
```

For test or refactor purpose, you can bind another provider on it to change the implementation of a service:

```js
const app = Machinat.crrateApp({
  services: [
    { provide: MyService, withProvider: AnotherService },
  ],
});

const [myService] = app.useServices([MyService]);
console.log(myService instanceof AnotherService); // true
```

Moreover you might want to have a interface to bind different providers on it, depends on different situations:

```js
import { makeInterface } from '@machinat/core';
import MyServiceImpl from './MyServiceImpl';

const MyService = makeInterface({ name: 'MyService' })

Machinat.crrateApp({
  services: [
    { provide: MyService, withProvider: MyServiceImpl },
  ],
});

const [myService] = app.useServices([MyService]);
```

`makeInterface` create a interface object for binding implementation. It can
also optionally accept multiple implementations with `multi` options like:


```js
import { makeInterface } from '@machinat/core';

const MyFavoriteFood = makeInterface({ name: 'MyService', multi: true })

Machinat.crrateApp({
  services: [
    { provide: MyFavoriteFood, withValue: '🌮' },
    { provide: MyFavoriteFood, withValue: '🥙' },
  ],
});

const [dinner] = app.useServices([MyFavoriteFood]);
console.log(dinner); // ['🌮', '🥙']
```

### Provide a Value

A value can be directly bound to an interface instead of a provider. This is especially useful to pass configurations in a decoupled way:

```js
const BotName = makeInterface({ name: 'BotName' })

Machinat.crrateApp({
  services: [
    { provide: BotName, withValue: 'David' },
  ],
});

const [botName] = app.useServices([BotName]);
console.log(botName); // David
```

### Service Lifetime

There are three types of lifetime which defines how long the the provider instance survive in the app:

- `'transient'` - the provider will created each time being required.
- `'scoped'` - the provider will only be created one time per services scope.
- `'singleton'` - the provider will be created when `app.start()` as a singleton in the app.

A service scope is an abstract period of time to 1) handle a received event or 2) dispatch the rendering.

For the provider has `'scoped'` lifetime, it will only be created one time lazily in a service scope. The instance will then being cached and used by later requisition.
