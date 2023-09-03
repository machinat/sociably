---
title: Dialog Script
---

A conversation is often composed of several questions and answers.
Such the _Q & A_ process is the key to make advanced features (like making an order)
and experiences (like asking for confirmation).

In Sociably, you can use a familiar way to build the conversation flows:
writing a **script**.

## What's Dialog Script?

**Dialog Script** works like a scripting language written in JSX.
You describe how a conversation should be processed in a _script_.
When it _runs_ up, the script processor takes over control and _process_ the dialog script on the chat.

## Install

You have to install the `@sociably/script` package to use dialog scripts.
And make sure you have a state provider installed like [`RedisState`](https://sociably.js.org/api/modules/redis_state.html) or [`FileState`](https://sociably.js.org/api/modules/dev_tools.html#file-state).


## Script Syntax

### Build a Script

Here is a dialog script for making an order:

```js
import Sociably from '@sociably/core';
import { build } from '@sociably/script';
import * as $ from '@sociably/script/keywords';
import OrderSideDish from './OrderSideDish';

export default build(
  {
    name: 'Ordering',
    initVars: (params) => ({
      mainDishes: params.mainDishes,
      mainDishChoice: undefined,
    }),
  },
  <>
    {() => <p>What main dish would you like?</p>}

    <$.WHILE 
      condition={({ vars: { mainDishes, mainDishChoice } }) =>
        !mainDishes.includes(mainDishChoice)
      }
    >
      {({ vars }) => <p>We have {vars.mainDishes.join(', ')}.</p>}

      <$.PROMPT
        key="ask-main-dish"
        set={({ vars }, { event }) => ({
          ...vars,
          mainDish: event.text,
        })}
      />
    </$.WHILE>

    {({ vars }) => <p>Our {vars.mainDishChoice} is good!</p>}

    <$.RETURN
      value={({ vars: { mainDishChoice } }) => ({ mainDishChoice })}
    />
  </>
);
```

We `build` the script with the metadata object and the script body in JSX. 
Note that the `name` of a script has to be unique in your app.

Let's break down how it works.

### Script Body

The script body is a special JSX block
which consist of a sequence of keyword elements and contents.
They are executed top-down as programming languages codes.

Notice that the keywords and contents shouldn't be dynamic in the script.
For example, **DON'T** do something like this:

```js
<>
  {someCondition
    ? <$.PROMPT
        key="ask-main-dish"
        set={({ vars }, { event }) => ({
          ...vars,
          mainDish: event.text,
        })}
      /> 
    : null}
</>
```

### Content Node

The messages UI cannot be placed in the script body directly.
They have to be wrapped into a _content node_.

A content node is a function that returns the messages to be sent.
It's placed in a script like:

```js
<>
  {() => <p>Pick a main dish you like.</p>}
</>
```

The function is called when the node is met in the script runtime.
And the returned messages are sent to continue the conversation.

### Script Environments

The content function receives the current runtime environments,
which can be used to generate messages.
Like:

```js
<>
  {({ vars }) => <p>We have {vars.mainDishes.join(', ')}.</p>}

  {({ vars }) => <p>Our {vars.mainDishChoice} is good!</p>}
</>
```

The runtime environments object contains the following info:

- `platform` - `string`, the platform where the dialog happens.
- `thread` - `object`, the chat thread where the dialog happens.
- `vars` - `object`, a state object for storing data. 

### `vars`

`vars` is a special state that exists while a script is running.
It's used to store the required info for processing the conversation.

`vars` is initiated by the `initVars` function when the script starts.
It receives an optional `params` object and returns the initial `vars`.
Like:

```js
export default build(
  {
    name: 'Ordering',
    initVars: (params) => ({
      mainDishes: params.mainDishes,
      mainDishChoice: undefined,
    }),
  },
  <>...</>
);
```

The `params` is passed in when the script is called.
We'll introduce that later.

### Keyword Element

The keyword elements describe how the conversation should be executed.
Here are the available keywords:

- `IF` - define an `if` flow.
  - `condition` - required, `(ScriptEnv) => boolean`, go to the `THEN` block if it returns true.
  - `children` - required, `THEN`, `ELSE` and `ELSE_IF` blocks.

- `THEN` - enter children block if `condition` of the parent `IF` is met.
  - `children` - required, script block.

- `ELSE_IF` - enter children block if `condition` is met.
  - `condition` - required, `(ScriptEnv) => boolean`
  - `children` - required, script block.

- `ELSE` - the fallback block.
  - `children` - required, script block.

- `WHILE` - define a `while` flow.
  - `condition` - required, `(ScriptEnv) => boolean`, loop the children block while it returns true.
  - `children` - required, script block.

- `PROMPT` - stop the execution of runtime and wait for the user's input.
  - `key` - required, `string`, an unique key for the stop point.
  - `set` - optional, `(ScriptEnv, Input) => Vars`, set `vars` value according to the input.
 
- `EFFECT` - define a side effect.
  - `set` - optional, `(ScriptEnv) => Vars`, execute a side effect and set the `vars` value.
  - `yield` - optional, `(ScriptEnv, Value) => Value`, register a middleware to yield a value. Check the [yielding value](#yielding-value) section.

- `LABEL` - label a start point which you can `goto` while starting.
  - `key` - required, `string`, an unique key for the start point.

- `CALL` - execute a script in the current runtime.
  - `key` - required, `string`, an unique key for the stop point.
  - `script` - required, the script to be called.
  - `params` - optional, `(ScriptEnv) => Params`, get the params passed to the script.
  - `goto` - optional, `string`, start execution from a label.
  - `set` - optional, `(ScriptEnv, Value) => Vars`, set `vars` value according to the result.

- `RETURN` - exit current script.
  - `value` - optional, `(ScriptEnv) => Vars`, the value to return.

### Prompting in Chat

`PROMPT` keyword is the core of the conversation flow.
It stops the runtime and waits for the user's input.
After the answer is received, the runtime continues from the `PROMPT` again.

```js
  <$.PROMPT
    key="ask-main-dish"
    set={({ vars }, { event }) => ({
      ...vars,
      mainDish: event.text,
    })}
  />
```

The `set` prop is used to store info about the answer.
It receives the answer event context and returns the new `vars` with the info.

### `key` Prop

The `key` prop labels an entry point in the script.
It has to be unique in the whole script.
That includes the `key` on `PROMPT`, `CALL` and `LABEL`.

:::warning
The `key` of a `PROMPT` or `CALL` has to be **fixed** after your app is online.
If it's changed, the processor would fail to find the point to continue.
We'll support a mechanism for migrating in the future.
:::

### Flow Control Keywords

Flow control keywords determine the flow of a conversation.
Like `WHILE` keyword in the example above:

```js
  <$.WHILE condition={({ vars }) => !MAIN_DISHES.includes(vars.mainDish)}>
    {() => <p>We have {MAIN_DISHES.join(', ')}.</p>}

    <$.PROMPT
      key="ask-main-dish"
      set={({ vars }, { event }) => ({
        ...vars,
        mainDish: event.text,
      })}
    />
  </$.WHILE>
```

`WHILE` keyword loops the children block while the `condition` is met.
The `PROMPT` is wrapped in `WHILE`,
so the bot would keep asking until a valid answer is received.

There are other control flow keywords like `IF`, `ELSE` and `RETURN`.
They work the same as in the programming languages,
so you can easily _program_ the conversation logic as coding.

### `RETURN` a Value

A script can return a value with `RETURN` keyword.
Like:

```js
  <$.RETURN
    value={({ vars: { mainDishChoice } }) => ({ mainDishChoice })}
  />
```

It passes the result of the conversation to the root handler or the parent script.

## Use Scripts

After a little setup, you can then use the scripts in your app.

### Register Scripts

The built scripts have to be registered while initiating the `@sociably/script` module.
Like this:

```js
import Sociably from '@sociably/core';
import Script from '@sociably/script';
// the built scripts
import BeforeSunset from './scenes/BeforeSunset';
import BeforeSunrise from './scenes/BeforeSunrise';
import BeforeMidnight from './scenes/BeforeMidnight';

const app = Sociably.createApp({
  modules: [
    Script.initModule({
      libs: [
        BeforeSunset,
        BeforeSunrise,
        BeforeMidnight,
      ],
    }),
    //...
  ],
  //...
});
```

### Handle Executing Runtimes

Last, we have to delegate chats with an executing runtime to the processor.
The processor will continue the dialog from the stop point in the script.

You can add these codes in the `app.onEvent` handler:

```js
import { serviceContainer } from '@sociably/core';
import Script from '@sociably/script';

app.onEvent(
  serviceContainer({ deps: [Script.Processor] })(
    (processor) => async (context) => {
      const { event, reply } = context;
      const runtime = await processor.continue(event.thread, context);
      if (runtime) {
        return reply(runtime.output());
      }

      // default logic...
    }
  )
);
```

If you're using `@sociably/stream`, you can `filter` the stream like:

```js
import { serviceContainer } from '@sociably/core';
import Script from '@sociably/script';
import { fromApp } from '@sociably/stream'
import { filter } from '@sociably/stream/operators'

const event$ = fromApp(app).pipe(
  filter(
    serviceContainer({ deps: [Script.Processor] })(
      (processor) => async (ctx) => {
        const runtime = await processor.continue(ctx.event.thread, ctx);
        if (runtime) {
          await ctx.reply(runtime.output());
        }
        return !runtime;
      }
    )
  )
);

event$.subscribe(({ event }) => {
  // default logic...
});
```

`processor.continue()` method returns the script runtime on a chat.
If there is an executing runtime, we continue the dialog by replying `runtime.output()`.

Finally, we should leave the chat to the processor and prevent further replying.

### Start a Script

If no script is currently running on a chat,
you can start a dialog script like this:

```js
await reply(<Ordering.Start params={{ mainDishes: ['🍖', '🍛', '🍜'] }} />);
```

When the `Start` component is rendered,
it executes the script and sends the beginning messages.
After that, the chat is handled by the processor till the script is finished.

The `params` prop is passed to the `initVars` of the script.
It works just like the function parameters that you can flexibly reuse the flow.

### Filter Event Type

You can select which events should be handled by the processor,
so only these events would push the dialog forward.
Like:

```js
  if (event.category === 'message' && event.category === 'callback') {
    const runtime = await processor.continue(event.thread, context);
    if (runtime) {
      return reply(runtime.output());
    }
  }
```

### Handle Return Value

If the script is finished with a returned value,
it's available at `runtime.returnValue`.
You can handle it like this:

```js
  const runtime = await processor.continue(event.thread, context);
  if (runtime) {
    await reply(runtime.output());

    if (runtime.returnValue) {
      // do something with `returnValue`
      await cook(runtime.returnValue.mainDishChoice);
    }
  }
```

## Advanced Usage

### Use Containers

The keywords can accept an asynchronized [service container](dependency-injection.md#service-container)
for the function props.
For example:

```js
import Sociably, { serviceContainer, IntentRecognizer } from '@sociably/core';
//...
<>
  {() => <p>Would you like any side dish?</p>}
  <$.PROMPT
    key="ask-side-dish"
    set={
      serviceContainer({ deps: [IntentRecognizer] })(
        (recognizer) =>
        async ({ vars, thread }, { event }) => {
          const intent = await recognizer.detectText(
            thread,
            event.text
          );
          return {
            ...vars,
            needSideDish: intent.type === 'yes'
          };
        }
      )
    }
  />
</>
```

In the example, we check intent with `IntentRecognizer` in the `set` prop.
Almost any operation in the script can use a container to require services,
including content nodes.

```js
<>
  {serviceContainer({ deps:[BaseProfiler] })(
    (profiler) => async ({ vars: { user, mainDishChoice } }) => {
      const profile = await profiler.getUserProfile(user);
      return <p>Hi, {profile.name}! Here's your {mainDishChoice}</p>;
    }
  )}
</>
```

### `CALL` a Script

We might want to reuse the conversation flow while building a complicated dialog.
The `CALL` keyword runs a script like a function call,
so we can use a flow several times even in different scripts.
Like this:

```js
import OrderSideDish from './OrderSideDish';
//...
<>
  <$.CALL
    script={OrderSideDish}
    key="order-side-dish"
    params={({ vars: { sideDishes } }) => ({ sideDishes })}
    set={({ vars }, { sideDishChoice }) =>
      ({ ...vars, sideDishChoice })
    }
  />
</>
```

`params` prop is called to get the script params,
which is available at `initVars` of the called script.

After the called script returns,
`set` prop receives the returned value and sets the new `vars`.
The runtime then continues from the `CALL` point.

### Macro Pattern

Another way to reuse the flow logic is using _macro_.
It's a function that returns a section of flow.
For example:

```js
const ASKING_DISH = (dishType, choices) => (
  <>
    {() => <p>What would you like for {dishType}?</p>}

    <$.WHILE condition={({ vars }) => !choices.includes(vars[dishType])}>
      {() => <p>We have {choices.join(', ')}.</p>}

      <$.PROMPT
        key={`ask-${dishType}`}
        set={({ vars }, { event }) => ({
          ...vars,
          [dishType]: event.text,
        })}
      />
    </$.WHILE>
  </>
);
```

The macro function can be used in the script like this:

```js
<>
  {() => <p>Welcome!</p>}
  {ASKING_DISH('main dish', ['🍖', '🍛', '🍜'])}
  {ASKING_DISH('dessert', ['🍰', '🍦', '🍮'])}
  {ASKING_DISH('drink', ['🍸', '🍵', '🍺'])}
  <$.RETURN value={({ vars }) => vars} />
</>
```

The macro is useful to reuse flow _within one script_.
It's more lightweight but doesn't have its own `vars` scope.

Notice that the `key` has to be unique in the script,
so you have to use a variable like ``key={`ask-${dishType}`}``.

### Execute a Side Effect

While making a functional app, it's necessary to handle [side effects](https://en.wikipedia.org/wiki/Side_effect_(computer_science))
in the flows.
The dialog script supports executing effects in several ways.
Each one has its pros and cons.

#### `EFFECT.set`

The first is executing a side effect directly using `EFFECT.set`.
Like:

```js
  <$.EFFECT
    set={serviceContainer({ deps: [StateController] })(
      (stateController) => async ({ vars, thread }) => {
        const visitCount = await stateController
          .threadState(thread)
          .set('visit_count', (count=0) => count + 1);

        return { ...vars, visitCount };
      }
    )}
  />
```

This is the simplest way. However while the scale of scripts grows,
it's really hard to know what effects have happened.
Especially when the scripts are highly nested.

So you should only use this in a simple and not nested script.

#### `RETURN.value`

The second is returning the value and executing the effect outside of the script.
For example:

```js
// at the script
  <$.RETURN
    value={({ vars: { mainDishChoice } }) => ({ mainDishChoice })}
  />
// at the handler
  const runtime = await processor.continue(event.thread, context);
  if (runtime?.returnValue) {
    await cook(runtime.returnValue.mainDishChoice);
  }
```

This way keeps the script itself [pure](https://en.wikipedia.org/wiki/Pure_function).
But the problem is you can only do this when a script is finished.

#### `EFFECT.yield`

The final one is using `EFFECT.yield`.
It registers a middleware to yield a value when the script is finished or stopped by a `PROMPT`.
For example:

```js
// parent script
<>
  <$.EFFECT
    yield={({ vars }, prev) => ({...prev, a: 0, b: 0})}
  />
  <$.CALL script={ChildScript} key="child" />
</>
// child script
<>
  <$.EFFECT
    yield={({ vars }, prev) => ({...prev, a: 1, c: 1})}
  />
  <$.PROMPT key="ask" />
</>
// handler
  const runtime = await processor.continue(event.thread, context);
  if (runtime.yieldValue) {
    console.log(runtime.yieldValue); // { a: 0, b: 0, c: 1 }
  }
```

When the script stops, all the yield middlewares that have been met are called in a reverse order.
The middleware receives the value from previous middleware and passes a value up.
Then we can use the final value in the handler.

This pattern is more complex, but it fixes the problems of the first two.
The scripts are pure and also every script in the calling chain can pop an effect when stopping.

## The Saga Pattern

The dialog script is a [saga pattern](https://microservices.io/patterns/data/saga.html)
implementation with the scripting sugar.
A saga is a sequence of asynchronized tasks to be executed in the defined order.
It's invented to handle long lived operations for server-side apps, like `PROMPT` in chatting.

![Script Saga Flow](./assets/script-saga-flow.png)

When you write a **script**, you define a saga to process the dialog.
After it's triggered, the orchestrator (script processor) executes all the tasks (dialog) in the programmed procedures.

The major benefit of saga pattern is to compose many operations (contents and keywords) into one atomic transaction (a script).
You only have to declare the flow in the script,
and the script processor would handle the rest of all.
