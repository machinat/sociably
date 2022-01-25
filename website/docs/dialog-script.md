---
title: Dialog Script
---

In a conversation, it's often that you need to ask a question and wait for the answer. A dialog may contain a sequence of relating questions and answers. It is common for features like making order or customer service.

Building the dialog flows logic is a challenge in a chatbot as a back-end based app. Machinat take a special approach which enable you writing **script** for a dialog.

## Install

You have to install `@machinat/script` package to use Machinat script. And make sure you have one state storage installed like [`RedisState`](https://machinat.com/api/modules/redis_state.html) or [`FileState`](https://machinat.com/api/modules/dev_tools.html#file-state).

## Building Script

Here is a simple Machinat script for making order:

```js
import Machinat, { makeContainer, IntentRecognizer } from '@machinat/core';
import { build } from '@machinat/script';
import * as $ from '@machinat/script/keywords';
import OrderSideDish from './OrderSideDish';

const MAIN_DISHES = ['steak', 'chicken', 'pork'];

export default build(
  { name: 'Ordering' },
  <>
    {() => <p>What main dish would you like?</p>}

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

    {({ vars }) => (
      <p>
        Our {vars.mainDish} is good!
        <br/>
        Would you like any side dish?
      </p>
    )}

    <$.PROMPT
      key="ask-side-dish"
      set={
        makeContainer({
          deps: [IntentRecognizer],
        })(recognizer =>
          async ({ vars, channel }, { event }) => {
            const { intentType } = await recognizer.detectText(
              channel,
              event.text
            );

            return {
              ...vars,
              wantSideDish: intentType === 'ok'
            };
          })
      }
    />

    <$.IF condition={({ vars }) => vars.wantSideDish}>
      <$.THEN>
         <$.CALL
           script={OrderSideDish}
           key="order-side-dish"
           set={({ vars }, { sideDish }) =>
             ({ ...vars, sideDish })
           }
         />
      </$.THEN>
      <$.ELSE>
        {() => 'OK, tell me if you need anything.'}
      </$.ELSE>
    </$.IF>

    <$.RETURN
      value={({ vars: { mainDish, sideDish } }) => ({ mainDish, sideDish })}
    />
  </>
);
```

As you can see, it works just like a script language! So you can easily handle complex flow in a flexible and declarative way as writing **script**.

The **script** is a Machinat element tree, constructed with sequence of keywords and content. We'll break down how it work in this section.

### Content Node

The content node is a function that returns the messages to be sent. A content node can be placed in a script like:

```js
<>
  {() => <p>Pick a main dish you like.</p>}
</>
```

When a content node is met while the script is executing, the function will be called to get the messages. The messages will then being sent to proceed the conversation.

### Script Environments

The content function would receive an object represent the current execution environments:

```js
<>
  {({ vars }) => (
    <p>
      Our {vars.mainDish} is good!
      <br />
      Would you like any side dish?
    </p>
  )}
</>
```

The environments object has the following properties:

- `platform` - `string`, the platform name where the dialog happen.
- `channel` - `object`, the channel where the dialog happen.
- `vars` - `object`, a state object for storing data. 

`vars` is a special state exists while script is executing. The data is available locally under per execution scope. We'll use the `vars` a lot later, to store the user's answer and proceed the conversation according to it.

### Keyword Element

The keyword element work just like keywords in script language, the dialog would be proceeded according to keywords met in the **script**. Here are the available keywords and their props:


- `IF` - define an `if` flow.
  - `condition` - required, `(scriptEnv) => boolean`, go to `THEN` block if return true.
  - `children` - required, `THEN`, `ELSE`, `ELSE_IF` blocks.

- `THEN` - proceed the block if the `IF` condition passed.
  - `children` - required, script block.

- `ELSE_IF` - proceed the block if condition prop passed.
  - `condition` - required, `(scriptEnv) => boolean`
  - `children` - required, script block.

- `ELSE` - fallback block.
  - `children` - required, script block.

- `WHILE` - define a `while` flow.
  - `condition` - required, `(scriptEnv) => boolean`, keep looping if condition return truthy.
  - `children` - required, script block.

- `PROMPT` - when a `PROMPT` element met, the execution stop and wait for user response.
  - `key` - required, `string`, unique key for the stop point.
  - `set` - optional, `(scriptEnv, Input) => vars`, set `vars` value according to the input.

- `EFFECT` - change `vars` value.
  - `do` - optional, `(scriptEnv) => Result`, execute a side effect.
  - `set` - optional, `(scriptEnv, Result) => vars`, set `vars` value.

- `LABEL` - label a start point of the script.
  - `key` - required, `string`, unique key for the start point.

- `CALL` - execute a sub-script.
  - `key` - required, `string`, unique key for the stop point.
  - `script` - required, the sub-script.
  - `vars` - optional, `(scriptEnv) => vars`, the vars to be used by the sub-script.
  - `goto` - optional, `string`, begin execution from a label.
  - `set` - optional, `(scriptEnv, Value) => vars`, set `vars` value according to the returned value.

- `RETURN` - exit current script.
  - `value` - optional, `(scriptEnv) => vars`, the value to return.

### Prompting in Chat

`PROMPT` is the most important keyword for building a staged dialog. It splits the dialog into different stages, an the processor would wait for the user inputs between them.

When the `PROMPT` element is executed in the script, the following thing will
happen in order:

1. Stop executing the script
2. Stop point info is stored in the state.
3. Wait for answer from user.
4. User reply the answer.
5. The `set` prop function is called for updating `vars`.
6. Continue running script from the `PROMPT`.

### Flow Control Keywords

Flow control keywords help you to handle the flow control of a conversation. Like in the upper example, a `PROMPT` is surrounded by `WHILE` keyword like:

```js
<>
...
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
...
</>
```

`WHILE` defines the `condition` for looping a section of conversation flow. We put a `PROMPT` in the children block, so the bot will keep asking user until a valid main dish is chosen and pass the `condition`.

Despite `WHILE`, there are other control flow keywords like `IF` and `RETURN`. You can use them as the way in programming language.

### Call Another Script

You can also call another script using `CALL` keyword. The processor will
execute the called script first, and continue from current point after the called
script is returned.

In the example above, we call an `OrderSideDish` script for a child ordering
flow. So the conversation logic can be reused by different scripts, or even use
it directly.

```js
<$.CALL
  script={OrderSideDish}
  key="order-side-dish"
  set={({ vars }, { sideDish }) => ({ ...vars, sideDish })}
/>
```

The `set` prop of `CALL` receive the environments object and the returned value
of the script (by `<$.RETURN value={...} />`). We can set `vars` value with the
result of the script for later use.

### Macro Pattern

Another way to reuse the conversation flow is macro style helper function. For 
example, we can extract the asking dishes flow like this:

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

The macro function can then be used in script like:

```js
<>
  {() => <p>Welcome!</p>}
  {ASKING_DISH('main dish', ['steak', 'chicken', 'pork'])}
  {ASKING_DISH('side dish', ['fries', 'salad'])}
  {ASKING_DISH('dessert', ['cake', 'pudding'])}
  <$.RETURN value={({ vars }) => vars} />
</>
```

This is particularly useful for reusing flows within a script. One thing to note here, the `key` still need to be unique in the whole script. Make sure you use variable argument to decide the `key` value.

### Using Containers

Every functional prop of keyword elements can be changed to an asynchronous [container](dependency-injection.md#service-container) version. It helps you to use services like recognizing intent. For example:

```js
<$.PROMPT
  key="ask-side-dish"
  set={
    makeContainer({ deps: [Base.IntentRecognizer] })(
      (recognizer) =>
        async ({ vars, channel }, { event }) => {
          const { intentType } = await recognizer.detectText(
            channel,
            event.text
          );

          return {
            ...vars,
            wantSideDish: intentType === 'ok'
          };
        }
    )
  }
/>
```


## Use Scripts

### Register Scripts

Before using scripts in your bot, you have to register the script module with all the built scripts like this:

```js
import Machiant from '@machinat/core';
import Script from '@machinat/script';
// your built scripts
import BeforeSunset from './scenes/BeforeSunset';
import BeforeSunrise from './scenes/BeforeSunrise';
import BeforeMidnight from './scenes/BeforeMidnight';

const app = Machiant.createApp({
  ...
  modules: [
    Script.initModule({
      libs: [
        BeforeSunset,
        BeforeSunrise,
        BeforeMidnight,
      ],
    })
  ]
});
```

### Delegate Chat to Processor

While a script is running on a chat, the control of the chat have to be delegated
to the script processor. The processor will handles the dialog according the script
that is running.

You can add these codes in the event handler:

```js
import { makeContainer } from '@machinat/core';
import Script from '@machinat/script';

app.onEvent(
  makeContainer({ deps: [Script.Processor] })(
    (processor) => async (context) => {
      const { event, reply } = context;

      const runtime = await processor.continue(event.channel, context);
      if (runtime) {
        return reply(runtime.output());
      }

      // default logic while not prompting in script...
    }
  )
);
```

The `processor.continue()` method return the current runtime on the chat if exists.
We can simply reply the dialog messages with `runtime.output()`.

Or if you're using `@machinat/stream`, filter the stream like this:

```js
import { makeContainer } from '@machinat/core';
import Script from '@machinat/script';
import { filter } from '@machinat/stream/operators'

// use the filtered
const nonExecutingChat$ = event$.pipe(
  filter(
    makeContainer({ deps: [Script.Processor] })(
      (processor) => async (ctx) => {
        const runtime = await processor.continue(ctx.event.channel, ctx);
        if (!runtime) {
          return true;
        }

        await ctx.reply(runtime.output());
        return false;
      }
    )
  )
);

nonExecutingChat$.subscribe(({ event }) => {
  // default logic while not prompting in script...
});
```

Sometime you don't want all the events to be handled by the script. For example,
to have scripts process only the messages events and leave the rest to other
handlers. We can simply bypass delegating codes like:

```js {6,23-25}
app.onEvent(
  makeContainer({ deps: [Script.Processor] })(
    (processor) => async (ctx) => {
      if (ctx.event.category === 'message') {    
        const runtime = await processor.continue(ctx.event.channel, ctx);
        if (runtime) {
          return ctx.reply(runtime.output());
        }
      }
      // ...
    }
  )
);

// or in the stream way

event$.pipe(
  filter(
    makeContainer({ deps: [Script.Processor] })(
      (processor) => async (ctx) => {
        if (context.event.category !== 'message') {    
          return true;
        }
        
        const runtime = await processor.continue(ctx.event.channel, ctx);
        if (!runtime) {
          return true;
        }

        await ctx.reply(runtime.output());
        return false;
      }
    )
  )
);
```


### Start Script

If no script is currently running on the chat, a script can be started with `processor.start()` method like this:

```js
const runtime = await processor.start(event.channel, Ordering);
await reply(runtime.output());
```

You can also send the output with additional messages like:

```js
await reply(
  <>
    <p>Good Evening!</p>
    {runtime.output()}
  </>
);
```

Once the script is started, the script processor will handle the conversation according to the script until it's finished. Overall, the events is handled under a flow like this:

![Script Saga Flow](./assets/script-saga-flow.png)

### The Saga Pattern

Machinat Script is actually a saga pattern implementation with the script keywords sugar. A saga means a sequence of asynchronous tasks that would be executed by the order defined. It is invented to handle long lived operations on the back-end, like `PROMPT` user in chat.

When you write a **script** with keywords, you actually define a saga for proceeding conversation. After it is triggered, all the contents and `PROMPT`s are promised to be finished before the script returns.

The major benefit of saga pattern is composing many operations (contents and promptings) into one atomic transaction (a script). You only have to declare the flow within script, then start it when you need. The script processor would handle the rest of all.
