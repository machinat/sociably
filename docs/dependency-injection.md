# Dependency Injection

To support many platforms and provide all the features, there have to be tons of services and the complex dependencies relationship between them. Machinat has a built-in [Inversion of Control](https://en.wikipedia.org/wiki/Inversion_of_control) system to help providing all the services and their dependencies.

When you create a Machinat app and start it, you actually create a set of service bindings then initiate some necessary starting processes:

```js
Machinat.createApp({
  platforms: [
    Messenger.initModule({ ... }),
    Line.initModule({ ... }),
  ],
  modules: [
    Http.initModule({ ... }),
  ],
  bindings: [
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

In Machinat this can be achieve by a **Service Container**. A Machinat container is simply a function annotated with the dependencies it required as the parameters.

```js
import { container } from '@machinat/core/service';

const fooBarContainer = container({
  deps: [FooI, BarI]
})((foo, bar) => {
  // do something with foo & bar ...
});
```

In the example above, the `container` helper annotate the `fooBarContainer` function needs two dependencies `FooI` and `BarI`. The `foo` and `bar` instances will be injected later into the container while running.

Machinat by default support dependencies injection for event/error handlers and components (experimental). It could also work in [`@machinat/script`](staged-dialog.md) and [`x-machinat`](reactive-programming.md).

### Container Handler

The `onEvent` and `onError` methods of app accept a container handler like this:

```js
import { container } from '@machinat/core/service';
import Messenger from '@machinat/messenger';

app.onEvent(
  container({
    deps: [Messenger.Profiler]
  })(profiler => async ({ event, bot } ) => {
    const profiler = await profiler.getUserProfile(event.user);

    await bot.render(event.channel, `Hello ${profile.name}!`)
  })
);
```

The handler container above is a curried function receives a `Messenger.Profiler` and returns an ordinary handler function. It works just like the ordinary handler is being contained!

When a event/error popped, app would inject the container then call the handler returned immediately.

### Container Component (experimental)

_This feature is on experiment and the behavior might changed in the future._

Machinat accept rendering container component in the message. It can help to make an expression according to the chat context or user info.

The hello logic in the upper handler example can be rewrite into a component like this:

```js
import Messenger from '@machinat/messenger';

const Hello = profiler => async props => {
  const profile = await profiler.getUserProfile(props.user);
  return `Hello ${profile.name}!`;
}

export default container({
  deps: [Messenger.Profiler],
})(Hello);
```

### Optional Requisition

By default an error would be throw if a unregistered dependency is being required. You can mark a requisition as optional to prevent this:

```js
container({
  deps: [{ require: FooService, optional: true }]
})(foo => ctx => {
  // foo would be null if not registered
  if (foo) {
    // ...
  }
})
```

### Register Bindings

Other than services from modules and platforms, you can register service individually with the `bindings` option:

```js
import MessengerAssetsManager from '@machinat/messenger/asset';
import FooService from './foo';

Machinat.createApp({
  platforms: [...],
  modules: [...],
  bindings: [
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
import { provider } from '@machinat/core/service';
import BeerService from './beer';

class BarService {
  constructor(beerService) {
    this.beerService = beerService;
  }

  serve() {
    return this.beerService.pour();
  }
}

export default provider({
  lifetime: 'singleton',
  deps: [BeerService],
})(BarService);
```

The `provider(options)(klass)` annotator is a curried function take the metadata options to annotate the following class constructor. `provider` take the following options:

- `lifetime` - required, the lifetime of the service within the app, one of `'singleton'`, `'scoped'` or `'transient'`. Check the [service lifetime](#service-lifetime) section for more details.
- `deps` - optional, the required dependencies of the provider, default to `[]`.
- `name` - optional, the name of provider, default to the name of the constructor.
- `factory` - optional, the factory function to create the provider instance, default to `(...deps) => new Klass(...deps)`.

Now you are able to register your service and use it:

```js
const app = Machinat.createApp({
  bindings: [BeerService, BarService],
});

const [bar] = app.useServices([BarService]);
bar.serve();
```

### Interface and Binding

Registering the provider class directly is actually a sugar to have a binding to itself as an interface. For example:

```js
Machinat.createApp({
  bindings: [MyService],
});
// is equivalent to
Machinat.crrateApp({
  bindings: [
    { provide: MyService, withProvider: MyService },
  ],
});
```

For test or refactor purpose, you can bind another provider on it to change the implementation of a service:

```js
const app = Machinat.crrateApp({
  bindings: [
    { provide: MyService, withProvider: AnotherService },
  ],
});

const [myService] = app.useServices([MyService]);
console.log(myService instanceof AnotherService); // true
```

Moreover you might want to have a pure interface to bind different providers on it depends on different situations:

```js
import { makeInterface } from '@machinat/core/service';

const MY_SERVICE_I = makeInterface({ name: 'MyService' })

Machinat.crrateApp({
  bindings: [
    { provide: MY_SERVICE_I, withProvider: MyService },
  ],
});
```

By convention, an non-providable interface is suffix with `I`. It can then be used to require the service bound to it.

### Provide a Value

A value can be directly bound to an interface instead of a provider. This is especially useful to pass configurations in a decoupled way:

```js
const BOT_NAME_I = makeInterface({ name: 'BotName' })

Machinat.crrateApp({
  bindings: [
    { provide: BOT_NAME_I, withValue: 'David' },
  ],
});

const [name] = app.useServices([BOT_NAME_I]);
console.log(name); // David
```

### Service Lifetime

There are three types of lifetime which defines how long the the provider instance survive in the app:

- `'transient'` - the provider will created each time being required.
- `'scoped'` - the provider will only be created one time per services scope.
- `'singleton'` - the provider will be created when `app.start()` as a singleton in the app.

A service scope is an abstract period of time to 1) handle a received event or 2) dispatch the rendering.

For the provider has `'scoped'` lifetime, it will only be created one time lazily in a service scope. The instance will then being cached and used by later requisition.

### Use base services

It is very common to have implementations by different platforms or situations. Machinat provide some `Base` interfaces of common services, so you can access them without worrying which implementation it is being used like this:

```js
import Base from '@machinat/core/base';

app.onEvent(
  container({
    deps: [Base.Profiler, Base.StateControllerI],
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

In the example above, `Base.Profiler` can be used to fetch profile of users from different platforms, the implementations is registered along with the platform modules. And the `Base.StateControllerI` is the interface to access the channel/user state, no matter which storage you registered (more about state will be discuss [later](/docs/using-state.md)).

For now the following `Base` interfaces are supported:

- [`Bot`](): render content to channel across platforms
- [`Profiler`](): fetch profile of users across platforms.
- [`StateControllerI`](): save and load state from storages.
- [`IntentRecognizerI`](): recognize intent with external providers.

## Next

Learn how to use intent recognition service in [next section](recognizing-intent.md).
