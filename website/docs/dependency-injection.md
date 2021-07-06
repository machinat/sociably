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
import { makeContainer } from '@machinat/core/service';

const fooBarContainer = makeContainer({
  deps: [FooI, BarI]
})((foo, bar) => {
  // do something with foo & bar ...
});
```

In the example above, the `makeContainer` helper annotate the `fooBarContainer` function needs two dependencies `FooI` and `BarI`. The `foo` and `bar` instances will be injected later into the container while running.

Machinat by default support dependencies injection for event/error handlers and components (experimental). It could also work in [`@machinat/script`](staged-dialog.md) and [`@machinat/stream`](reactive-programming.md).

### Container Handler

The `app.onEvent` and `app.onError` methods can accept a container handler like this:

```js
import { container } from '@machinat/core/service';
import Messenger from '@machinat/messenger';

app.onEvent(
  container({ deps: [Messenger.Profiler] })(
    (profiler) => async ({ event, reply } ) => {
      const profile = await profiler.getUserProfile(event.user);

      await reply(`Hello ${profile.name}!`)
    }
  )
);
```

The handler container above is a curried function receives a `Messenger.Profiler` and returns an ordinary handler function. It works just like the ordinary handler is being contained by a factory function.

When a event/error is popped, app would inject the container then call the returned handler immediately.

### Optional Requisition

By default an error would be throw if a unregistered dependency is being required. You can mark a requisition as optional to prevent this:

```js
container({
  deps: [{ require: FooService, optional: true }]
})((foo) => (ctx) => {
  // foo would be null if not registered
  if (foo) {
    // ...
  }
})
```

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
container({ deps: [FooService, MessengerAssetsManager] })(
  (foo, assetsManager) => ctx => {
    // ...
  }
)
```

## Providing Services

In spite of the official services, it is really easy to make a service provider from a JavaScript class.

Before register your own class in the app, you have to annotate the metadata about it:

```js
import { makeClassProvider } from '@machinat/core/service';
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
import { makeInterface } from '@machinat/core/service';
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
import { makeInterface } from '@machinat/core/service';

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

### Use Base Services

It is very common to have implementations by different platforms or situations. Machinat provide some `Base` interfaces of common services, so you can access them without worrying which implementation it is being used like this:

```js
import Profiler from '@machinat/core/base/Profiler';
import StateController from '@machinat/core/base/StateController';

app.onEvent(
  container({
    deps: [Profiler, StateController],
  })(
    (profiler, stateController) => async context => {
      const { bot, event: { channel, user } } = context;

      const profile = await profiler.getUserProfile(user);
      await bot.render(channel, `Hello ${profile.name}!`);

      await stateController
        .channelState(channel)
        .update('hello_count', (count = 0) => count + 1);
    }
  )
);
```

In the example above, `Base.Profiler` can be used to fetch profile of users from different platforms, the implementations is registered along with the platform modules. And the `Base.StateController` is the interface to access the channel/user state, no matter which storage you registered (more about state will be discuss [later](using-states.md)).

For now the following `Base` interfaces are supported:

- [`Bot`](/api/modules/core_base_bot): send messages to a channel across platforms, also available on `Machinat.Bot`.
- [`Profiler`](/api/modules/core_base_profiler): fetch profile of users across platforms, also available on `Machinat.Profiler`.
- [`StateController`](/api/modules/core_base_statecontroller): save and load state from state storage.
- [`IntentRecognizer`](api/modules/core_base_intentrecognizer): recognize intent with external providers.
- [`Marshaler`](api/modules/core_base_marshaler): marshal/unmarshal instances of built-in classes like user and channel.


## Next

Learn how to use intent recognition service in [next section](recognizing-intent.md).
