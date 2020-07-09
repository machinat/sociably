# Providing and Using Services

Machinat is designed to support many event based platform and provide complete features of them. You can imagine there have to be tons of interfaces and services to achieve this. Machinat has a built-in [inversion of control](https://en.wikipedia.org/wiki/Inversion_of_control) system to help providing and fetching all the services and their dependencies.

When you create a Machinat app and start it, you actually create a set of service bindings then initiate some necessary starting processes:

```js
Machinat.createApp({
  platforms: [
    Messenger.initModule({ ... }),
    Line.initModule({ ... }),
  ],
  modules: [
    HTTP.initModule({ ... }),
  ],
  bindings: [
    MyService,
  ],
}).start();
```

## Require Services from App

Services can be required from app directly:

```js
import Messenger from '@machinat/messenger';
import Line from '@machinat/line';

const [messengerBot, lineBot] = app.useServices([
  Messenger.Bot,
  Line.Bot,
]);
```

`app.useServices` accepts an array of interfaces and return the service instances bound. In the upper case, the `Bot` classes are registered with platform modules and the instances created when `app.start()`.

Conventionally interfaces provided by a module are exported with it, check references of modules for the details of services.

## Service Container

Dependencies injection is a technique to allow injected code to receive its dependencies. In Machinat this can be achieve by a **Service Container**. Machinat Container is a function take the dependencies as params and return the "contained logic".

By default Machinat support using container as event/error handler or component.

### Container Handler

The `onEvent` and `onError` methods of app accept a container handler like this:

```js
import { container } from '@machinat/core/service';
import Messenger from '@machinat/messenger';

const sayHello = container({
  deps: [Messenger.ProfileFetcher]
})(profiler => async ({ channel, user, bot } ) => {
  const profiler = await profiler.fetchProfile(user);

  await bot.render(channel, `Hello ${profile.name}!`)
});

app.onEvent(sayHello);
```

The `container` function annotate the handler has one dependency `Messenger.ProfileFetcher`, it will be injected into the container when event received. The handler container is a curried function receives a `Messenger.ProfileFetcher` and returns an ordinary handler function, just like the ordinary handler is being contained.

### Container Component

Machinat accept rendering container component in the message, this is helpful to render the words according to the chat context or user info. The above hello logic in the handler can be rewrite to a component like this:

```js
import Messenger from '@machinat/messenger';

const Hello = profiler => async props => {
  const profile = await profiler.fetchProfile(props.user);
  return `Hello ${profile.name}!`;
}

export default container({ deps: [Messenger.ProfileFetcher] })(Hello);
```

## Optional Requisition

By default it would throw if a dependency not registered is being required. You can mark a requisition as optional to prevent this:

```js
container({
  deps: [{ require: FooService, optional: true }]
})(foo => ctx => {
  if (foo) {
    // ...
  }
})
```

## Service Provider

Despite services from modules and platforms, you can register service individually with the `bindings` option like:

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
  (foo, assets) => ctx => {
    // ...
  }
)

```

### Create a Provider

Before register your own class as a service, you must annotate the metadata about it:

```js
import { provider } from '@machinat/core/service';
import BeerService from './beer';

class BarService {
  constructor(beerService) {
    this.beerService = beerService;
  }

  serve() {
    return new Cup(this.beerService.pour())
  }
}

export default provider({
  lifetime: 'singleton',
  deps: [BeerService],
})(BarService);
```

The `provider(options)(klass)` annotator is a curried function take the metadata options to annotate the following class constructor. `provider` take the following options:

- `lifetime` - required, the lifetime of the service within the app, one of `'singleton'`, `'scoped'` or `'transient'`. Check the [service lifetime]() section for more details.
- `deps` - optional, the required dependencies of the provider, default to `[]`.
- `name` - optional, the name of provider, default to the name of the constructor.
- `factory` - optional, the factory function to create the provider instance, default to `(...deps) => new Klass(...deps)`.

### Interface and Binding

In the upper case, register the provider directly is actually a sugar to have binding to itself as an interface.

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

You can change the implementation by binding another provider to the interface:

```js
Machinat.crrateApp({
  bindings: [
    { provide: MyService, withProvider: AnotherService },
  ],
});
```

Moreover you might want to have an interface to bind implementing provider on it depends on different situation:

```js
import { makeInterface } from '@machinat/core/service';

const MY_SERVICE_I = makeInterface({ name: 'MyService' })

Machinat.crrateApp({
  bindings: [
    { provide: MY_SERVICE_I, withProvider: MyService },
  ],
});
```

An interface is suffix with `I` as a convention, then can be used to require the provider bound to it.

### Provide value

You can directly bind a value to an interface, this is especially useful to pass configs in a decoupled way:

```js
const SERVER_ENTRY_I = makeInterface({ name: 'ServerEntry' })

Machinat.crrateApp({
  bindings: [
    { provide: SERVER_ENTRY_I, withValue: 'http://...' },
  ],
});
```

### Service Lifetime

There are three types of lifetime which defines how long the the provider instance survive in the app:
- `'transient'` - the provider will created each time being required.
- `'scoped'` - the provider will only be created one time per services scope.
- `'singleton'` - the provider will be created when `app.start()` as a singleton in the app.

A service scope is an abstract period of time to 1) handle a received event or 2) dispatch the rendering.

For the provider has `'scoped'` lifetime, it will only be created one time lazily in a service scope. The instance will then being cached and used by later requisition.

### Register by Platform

A service binding can be registered only on specific platforms only like:

```js
import Base from '@machinat/core/base'

Machinat.crrateApp({
  bindings: [
    {
      provide: Base.BotI,
      withProvider: FooBot,
      platforms: ['foo']
    },
  ],
});
```

In the case above, `FooBot` will only be provided within a service scope initiate by `'foo'` platform. i.e. while receiving a `'foo'` platform event or dispatching to `'foo'` platform.


This allow serving an interface with different implementations by platforms. Fetching profile is a good usage example:

```js
import Base from '@machinat/core/base';

app.onEvent(
  container({
    deps: [
      { require: Base.ProfileFetcherI, optional: true },
    ],
  })(profiler => context => {
    const { bot, channel, user } = context;

    if (profiler) {
      const profile = await profiler.fetchProfile(user);
      await bot.render(channel, `Hello ${profile.name}!`);
    } else {
      await bot.render(channel, `Hello!`);
    }
  });
);
```

`Base` provide a set of common interfaces for platforms to implement. In the case above we use `Base.ProfileFetcherI` if provided by current platform instead of requiring every platform implementations.
