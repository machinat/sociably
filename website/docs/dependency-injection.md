---
title: Dependency Injection
---

While building an app, we may rely on many services to ship features.
The dependent relationship between the services could be complex,
especially for a cross-platform app.

Sociably has a built-in [Dependency Injection](https://en.wikipedia.org/wiki/Dependency_injection)
system to help with that.
Actually the whole framework is built upon the DI system.

## Initiate Services

When you create and start a Sociably app,
a set of services are initiated to make the app works.
For example:

```js
import Sociably from '@sociably/core';
import Http from '@sociably/http';
import Facebook from '@sociably/facebook';
import Telegram from '@sociably/telegram';
import { FileState } from '@sociably/dev-tools';
import FooService from './services/Foo';
import BarService from './services/Bar';

const app = Sociably.createApp({
  platforms: [
    Facebook.initModule({/*...*/}),
    Telegram.initModule({/*...*/}),
  ],
  modules: [
    Http.initModule({/*...*/}),
    FileState.initModule({/*...*/})
  ],
  services: [
    FooService,
    BarService,
  ],
});
app.start();
```

### Register Modules

The `platforms` and `modules` options add services for a particular platform or functionality.
For example, `Facebook.Bot` service is added by the `Facebook` platform.
The bot instance is then created when `app.start()`.

Sociably is made with _progressive framework_ paradigm.
You can start with minimum modules and gradually add more when you need.

Check [API references](pathname:///api) to see all the available modules.

## Use Services

After the app is started, we can require services and use them like:

```js
import Sociably from '@sociably/core';
import Facebook from '@sociably/facebook';
import Telegram from '@sociably/telegram';

const app = Sociably.createApp({/* ... */});

app.start().then(() => {
  const [facebookBot, telegramBot] = app.useServices([
    Facebook.Bot,
    Telegram.Bot,
  ]);
  // use the bots ...
});
```

`app.useServices()` accepts an array of service interfaces and returns the service instances.
Note that it should only be called after `app.start()` is finished.

## Service Container

We can also require services as the params of a function,
that is a **Service Container**.
The `makeContainer` decorator annotates a JavaScript function as a container.
Like:

```js
import { makeContainer } from '@sociably/core';
import FooService from './services/Foo';
import BarService from './services/Bar';

const fooBarContainer = makeContainer({
  deps: [FooService, BarService]
})((foo, bar) => {
  // do something with foo & bar ...
});
```

In the example above, `fooBarContainer` function requires two dependencies `FooService` and `BarService`.
The service instances `foo` and `bar` will be injected into the container when it's triggered by the app.

### Container Handler

The `app.onEvent` and `app.onError` methods can accept a container of the handler.
For example:

```js
import { makeContainer, BasicProfiler } from '@sociably/core';

app.onEvent(
  makeContainer({ deps: [BasicProfiler] })(
    (profiler) =>
    async ({ event, reply } ) => {
      const profile = await profiler.getUserProfile(event.user);
      await reply(<p>Hello {profile.lastName}!</p>)
    }
  )
);
```

The container receives a `BasicProfiler` instance and returns an ordinary handler function.
When an event is popped, the _contained_ handler receives event context as usual.
Then it can use the required `profiler` for replying.

Many Sociably APIs support using a container as the callback handler,
like [`@sociably/script`](pathname:///api/modules/script) and [`@sociably/stream`](pathname:///api/modules/script).
We'll introduce them later.

### Optional Requisition

By default it throws an error if an unregistered dependency is required.
You can mark a dependency as optional to prevent it.

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

### Standard Services

Sociably defines some standard services which are commonly used while making conversational apps.
Like recognizing intent, fetching an user’s profile and accessing chat state.

Here is an example to put them together:

```js
import {
  makeContainer,
  IntentRecognizer,
  BasicProfiler,
  StateController,
} from '@sociably/core';

app.onEvent(
  makeContainer({
    deps: [IntentRecognizer, BasicProfiler, StateController],
  })(
    (recognizer, profiler, stateController) =>
    async (context) => {
      const { bot, event } = context;
      const { channel, user } = event;

      if (event.type === 'text') {
        const intent = await recognizer.detectText(channel, event.text);

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

Here are the list of the standard services:

- [`BasicBot`](pathname:///api/modules/core_base_bot): Render messages on a platform-agnostic channel.
- [`BasicProfiler`](pathname:///api/modules/core_base_profiler): Fetch profile of a platform-agnostic user.
- [`StateController`](pathname:///api/modules/core_base_statecontroller): Save and load channel/user/global state from the storage. We'll introduce it in the [Using State](using-states.md) doc.
- [`IntentRecognizer`](pathname:///api/modules/core_base_intentrecognizer): Recognize the intent of a message. We'll introduce it in the [Recognizing Intent](recognizing-intent.md) doc.

### Register Services

We can also register individual service in the `services` option:

```js
import FacebookAssetsManager from '@sociably/facebook/asset';
import FooService from './foo';

Sociably.createApp({
  platforms: [/*...*/],
  modules: [/*...*/],
  services: [
    FacebookAssetsManager,
    FooService,
  ],
})
```

The services then can be required via `app.useServices()` or a container.

```js
const [foo, assets] = app.useServices([
  FooService,
  FacebookAssetsManager,
]);

makeContainer({ deps: [FooService, FacebookAssetsManager] })(
  (foo, assetsManager) =>
  (ctx) => {
    // ...
  }
)
```

## Providing Services

### Class Provider

Despite the standard services, it's easy to make your own ones.
You only have to mark a normal class as a service provider.
For example:

```js
import { makeClassProvider } from '@sociably/core';
import BeerService from './Beer';

class BarService {
  constructor(beerService) {
    this.beerService = beerService;
  }

  serve(drink) {
    if (drink !== '🍺') {
      return null;
    }
    return this.beerService.pour();
  }
}

export default makeClassProvider({
  lifetime: 'singleton',
  deps: [BeerService],
})(BarService);
```

`makeClassProvider(options)(Klass)` decorator annotates a class constructor as a service.
It takes the following options:

- `deps` - required, the dependencies of the provider.
- `lifetime` - optional, the lifetime of the service, has to be one of `'singleton'`, `'scoped'` or `'transient'`. Default to `'singleton'`. Check the [service lifetime](#service-lifetime) section.
- `name` - optional, the name of the provider, default to the constructor name.
- `factory` - optional, the factory function to create the provider instance, default to `(...deps) => new Klass(...deps)`.

Now we can register the service and use it like:

```js
const app = Sociably.createApp({
  services: [BeerService, BarService],
});

app.start().then(() => {
  const [bar] = app.useServices([BarService]);
  return bar.serve('🍺');
});
```

### Factory Provider

We can make a provider with another style: a factory function.
For example:

```js
import { makeFactoryProvider } from '@sociably/core';
import BeerService from './Beer';

const useBar = (beerService) => (drink) =>
  drink === '🍺' ? beerService.pour() : null;

export default makeFactoryProvider({
  lifetime: 'transient',
  deps: [BeerService],
})(BarService);
```

`makeFactoryProvider(options)(factoryFn)` decorator annotates a factory function as a service.
The factory function receives the dependencies like a container and returns the service instance (which can be a function).
It takes the following options:

- `deps` - required, the dependencies of the provider.
- `lifetime` - optional, the lifetime of the service, has to be one of `'singleton'`, `'scoped'` or `'transient'`. Default to `'transient'`. Check the [service lifetime](#service-lifetime) section.
- `name` - optional, the name of the provider, default to the factory function name.

Then we can register and use the service like:

```js
const app = Sociably.createApp({
  services: [BeerService, useBar],
});

app.start().then(() => {
  const [getDrink] = app.useServices([useBar]);
  return getDrink('🍺');
});
```

### Interface and Binding

The provider is also a _service interface_ so we can require it as a dependency.
When we register the provider, it provides the service instance for _itself_.

```js
Sociably.createApp({
  services: [MyService],
});
// is equivalent to
Sociably.crrateApp({
  services: [
    { provide: MyService, withProvider: MyService },
  ],
});
```

The binding between a _service interface_ and a _service provider_ is created when we register a service.
The interface can be bound to another provider,
so we can swap the service implementation.

```js
const app = Sociably.crrateApp({
  services: [
    { provide: MyService, withProvider: AnotherService },
  ],
});

const [myService] = app.useServices([MyService]);
console.log(myService instanceof AnotherService); // true
```

### Pure Interface

Besides the provider itself,
we can create an interface with `makeInterface` for binding different implementations.
For example:

```js
import { makeInterface } from '@sociably/core';
import MyServiceImpl from './MyServiceImpl';

const MyService = makeInterface({ name: 'MyService' });

Sociably.crrateApp({
  services: [
    { provide: MyService, withProvider: MyServiceImpl },
  ],
});

const [myService] = app.useServices([MyService]);
console.log(myService instanceof MyServiceImpl); // true
```

### Provide a Value

An interface can be bound with the value directly instead of a provider.
This is especially useful to pass configurations in a decoupled way:

```js
const BotName = makeInterface({ name: 'BotName' })

Sociably.crrateApp({
  services: [
    { provide: BotName, withValue: 'David' },
  ],
});

const [botName] = app.useServices([BotName]);
console.log(botName); // David
```

### Multiple Bindings

An interface can also accept multiple implementations with `multi` option.
When we require a `multi` interface, a list of services is resolved.
Like this:

```js
import { makeInterface } from '@sociably/core';

const MyFavoriteFood = makeInterface({ name: 'MyService', multi: true })

Sociably.crrateApp({
  services: [
    { provide: MyFavoriteFood, withValue: '🌮' },
    { provide: MyFavoriteFood, withValue: '🥙' },
  ],
});

const [dinner] = app.useServices([MyFavoriteFood]);
console.log(dinner); // ['🌮', '🥙']
```

### Service Lifetime

Service lifetime defines how the service instances are created in the app.
There are three types of lifetime:

- `'transient'` - every time the service is required.
- `'scoped'` - only once per service scope.
- `'singleton'` - only once in the app when `app.start()`.

A service scope is an abstract period for handling an event or dispatching the messages.
A service with `'scoped'` lifetime is created lazily in a scope,
and the instance will be cached for later requisition.
