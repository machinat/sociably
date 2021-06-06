---
title: Staged Dialog
---

## Staged Dialog

In a conversation, it is often you need to ask a question and wait for the answer. A dialog may contain a sequence of relating questions and answers. Let's call this kind of dialogs as _staged_.

A staged dialog is common when making order or customer service. In some more complex situations, a conversation may even contain many conditional branches of staged dialogs.

Building staged dialog flows is a challenge in a chatbot as a back-end based app. Machinat take a special approach which enable you writing the **script** for a staged dialog.

Here is a simple Machinat script for making order:

```js
import Machinat from '@machinat/core';
import { container } from '@machinat/core/service';
import IntentRecognizerI from '@machinat/core/base/IntentRecognizerI';
import { build } from '@machinat/script';
import {
  WHILE,
  PROMPT,
  IF,
  THEN,
  ELSE,
  CALL,
  RETURN,
} from '@machinat/script/keywords';
import OrderSideDish from './OrderSideDish';

const MAIN_DISHES = ['steak', 'chicken', 'pork'];

const Order = build(
  'Order',
  <>
    {() => <p>What main dish would you like?</p>}

    <WHILE
      condition={({ vars }) =>
        !MAIN_DISHES.includes(vars.mainDish)
      }
    >
      {() => <p>We have {MAIN_DISHES.join(', ')}.</p>}

      <PROMPT
        key="ask-main-dish"
        set={({ vars }, { event }) => ({
          ...vars,
          mainDish: event.text,
        })}
      />
    </WHILE>

    {({ vars }) => (
      <p>
        Our {vars.mainDish} is good!
        <br/>
        Would you like any side dish?
      </p>
    )}

    <PROMPT
      key="ask-side-dish"
      set={
        container({
          deps: [IntentRecognizerI],
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

    <IF condition={({ vars }) => vars.wantSideDish}>
      <THEN>
         <CALL
           script={OrderSideDish}
           key="order-side-dish"
           set={({ vars }, { sideDish }) =>
             ({ ...vars, sideDish })
           }
         />
      </THEN>
      <ELSE>
        {() => 'OK, tell me if you need anything.'}
      </ELSE>
    </IF>

    <RETURN
      value={({ vars: { mainDish, sideDish } }) =>
        ({ mainDish, sideDish })
      }
    />
  </>
);
```

As you can see, it works just like a script language! So you can easily handle complex flow in a flexible and declarative way as writing **script**.

The **script** is a Machinat element tree, constructed with sequence of keywords and content. We'll break down how it work in this section.

## Content Node

The content node is a function that returns the message to be sent. A content node can be placed in a script like:

```js
<>
...
  {() => <p>Pick a main dish you like.</p>}
...
</>
```

### Circumstance Object

The content function would receive an object represent the current execution circumstance:

```js
<>
...
  {({ vars }) => (
    <p>
      Our {vars.mainDish} is good!
      <br />
      Would you like any side dish?
    </p>
  )}
...
</>
```

The circumstance object has the following properties:

- `platform` - `string`, the platform name where the dialog happen.
- `channel` - `object`, the channel where the dialog happen.
- `vars` - `object`, a state object you can used to store data. The data is per execution scoped, you can consider it as using the `var` keyword in a function.

### Execute Time and Render Time

While a script executing, the following 2 steps about the content would happen:

1. When a content node is met, the content function is called for retrieving the message.
2. After a `PROMPT` or at the end of script, messages collected from content nodes is rendered and sent.

The 2 steps happens at different time, we call them _execute time_ and _render time_. Flow related logic like asking the question before `PROMPT` is handled at _execute time_. The presentation of the question is then determined at render time while rendering the message.

## Keyword Element

The keyword element work just like keywords in script language, the dialog would be proceeded according to keywords met in the **script**. Here are the available keywords and their props:


- `IF` - define an `if` flow.
  - `condition` - required, `(Circumstance) => boolean`, go to `THEN` block if return true.
  - `children` - required, `THEN`, `ELSE`, `ELSE_IF` blocks.

- `THEN` - proceed the block if the `IF` condition passed.
  - `children` - required, script block.

- `ELSE_IF` - proceed the block if condition prop passed.
  - `condition` - required, `(Circumstance) => boolean`
  - `children` - required, script block.

- `ELSE` - fallback block.
  - `children` - required, script block.

- `WHILE` - define a `while` flow.
  - `condition` - required, `(Circumstance) => boolean`, keep looping if condition return truthy.
  - `children` - required, script block.

- `PROMPT` - when a `PROMPT` element met, the execution stop and wait for user response.
  - `key` - required, `string`, the key to identify the stop point.
  - `set` - optional, `(Circumstance, Input) => Vars`, set new `vars` according to the input.

- `VARS` - change `vars` value.
  - `set` - required, `(Circumstance) => Vars`, set new `vars`.

- `LABEL` - label a start point of the script.
  - `key` - required, the key you can `goto` when call the script.

- `CALL` - execute a sub-script.
  - `key` - required, `string`, the key to identify the stop point.
  - `script` - required, the sub-script.
  - `vars` - optional, `(Circumstance) => Vars`, the vars to be used by the sub-script.
  - `goto` - optional, `string`, begin execution from a label.
  - `set` - optional, `(Circumstance, Value) => Vars`, set `vars` according to the returned value.

- `RETURN` - exit current script.
  - `value` - optional, `(Circumstance) => Vars`, the value to return.

### Designing a Dialog

`PROMPT` is the most important keyword for building a staged dialog. It splits the dialog into different stages, an the processor would wait for the user inputs between them.

Other keywords help you to handle the flow control flow surrounding `PROMPT`. Like in the upper example:

```js
<>
...
  <WHILE
    condition={({ vars }) =>
      !MAIN_DISHES.includes(vars.mainDish)
    }
  >
    {() => <p>We have {MAIN_DISHES.join(', ')}.</p>}

    <PROMPT
      key="ask-main-dish"
      set={({ vars }, { event }) => ({
        ...vars,
        mainDish: event.text,
      })}
    />
  </WHILE>
...
</>
```

`WHILE` defines the condition and the block to be looped containing a `PROMPT`. This make the bot keep asking user until a valid main dish is chosen.

### Using Containers

Every functional prop of keyword elements can be changed to an asynchronous [container](dependency-injection.md#service-container) version. It helps you to use services like recognizing intent in the dialog flow.

```js
...
<PROMPT
  key="ask-side-dish"
  set={
    container({
      deps: [Base.IntentRecognizer],
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
...
```

## Use the Scripts

Before using scripts in your bot, you have to register the script processor service with all the scripts at first:

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

Then add the following code in your event handler:

```js
import { container } from '@machinat/core/service';
import Script from '@machinat/script';

app.onEvent(
  container({
    deps: [Script.Processor] }
  )(processor => async context => {
    const { bot, event: { channel } } = context;

    const runtime = await processor.continue(channel, context);
    if (runtime) {
      return bot.render(channel, runtime.output());
    }

    // default logic while not prompting...
  })
);
```

The code above intercept the event if any script is now running on the current channel. If no script is running, you can respond any message or start a script with:

```js
const runtime = await processor.start(channel, MyScript);
bot.render(channel, runtime.output());
```

Once a script is started, events would be delegated to the `Processor` until it is finished. Overall, the events is handled under a flow like this:

![Script Saga Flow](./assets/script-saga-flow.png)

### The Saga Pattern

Machinat Script is a saga pattern implementation with the flow keywords sugar. A saga means a sequence of asynchronous tasks that would be executed by the order defined. It is invented to handle long lived operations on the back-end, like a _prompting_.

When you write a **script** with keywords, you define a saga that instruct `Processor` how to proceed the dialog. After a saga is triggered, all the contents and `PROMPT`s are promised to be finished before it successfully end or abort.

The major benefit of saga pattern is composing many atomic operations (promptings) into one atomic transaction (a dialog). You only have to declare the flow within script, then start it when you need. The script processor would handle the rest of all.

## Next

Learn how to extend the experience with GUI by integrating a webview in [next section](integration-with-webview.md).
