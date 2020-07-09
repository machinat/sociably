## Staged Dialog

We have learn about using state at last section, but the process of a conversation topic could be more complex. Think about customer service, the whole conversation may contain many nested branches composed by series of questions and answers.

Building such the dialog flow could be a challenge in chatbot as a back-end based app. Machinat use a very different approach from other frameworks, allow you writing the **script** of a staged dialog:

```js
import Machinat from '@machinat/core';
import {
  build,
  WHILE,
  PROMPT,
  IF,
  THEN,
  ELSE,
  CALL,
  RETURN,
} from '@machinat/script';
import OrderDessert from './OrderDessert';

const MAIN_COURSES = ['steak', 'chicken', 'pork'];

const OrderMainCourse = build(
  'OrderMainCourse',
  <>
    {() => <p>Pick a main course you like.</p>}

    <WHILE
      condition={({ vars }) =>
        !MAIN_COURSES.includes(vars.mainCourse)
      }
    >
      {() => <p>We have {MAIN_COURSES.join(', ')}.</p>}

      <PROMPT
        key="ask-main-course"
        set={({ vars }, { event }) => ({
          ...vars,
          mainCourse: event.text,
        })}
      />
    </WHILE>

    {({ vars }) => (
      <p>
        Our {vars.mainCourse} is good!
        <br/>
        Would you like dessert?
      </p>
    )}

    <PROMPT
      key="ask-dessert"
      set={({ vars }, { event }) => {
        if (event.text === 'yes') {
          return { ...vars, wantDessert: true };
        }
        return { ...vars, wantDessert: false };
      }}
    />

    <IF condition={({ vars }) => vars.wantDessert}>
      <THEN>
         <CALL
           script={OrderDessert}
           key="order-dessert"
           set={({ vars }, { dessert }) =>
             ({ ...vars, dessert })
           }
         />
      </THEN>
      <ELSE>
        {() => 'OK, tell me if you need anything.'}
      </ELSE>
    </IF>

    <RETURN
      value={({ vars: { mainCourse, dessert } }) =>
        ({ mainCourse, dessert })
      }
    />
  </>
);
```

Yes, it works just like a script language! Through this we can easily handle complex flow with flexibility, and at the same time represent the whole flow in a declarative way.

The **script** is actually a Machinat element tree, constructed with sequence of keywords and content. Let's break down how it work:

## Content in Script

The content node is a function that returns the message to be sent:

```js
<>
...
  {() => <p>Pick a main course you like.</p>}
...
</>
```

The content function receive a executing circumstance object:

```js
<>
...
  {({ vars }) => (
    <p>
      Our {vars.mainCourse} is good!
      <br/>
      Would you like dessert?
    </p>
  )}
...
</>
```

The `vars` is user defined state that can be useful to determine the message content. We will talk about how to alter the `vars` value later.

### Circumstance Object

The circumstance object has the following properties:

- `platform` - `string`, the platform the dialog happen on.
- `channel` - `object`, the channel the dialog happen on.
- `vars` - `object`, a object to store data during the execution. The data is per execution scoped, you can consider it as using the `var` keyword in a function.


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
  - `set` - optional, `(Circumstance, Input) => Vars`, return vars from input.

- `VARS` - change `vars` value.
  - `set` - required, `(Circumstance) => Vars`, return new `vars`.

- `LABEL` - label a start point of the script.
  - `key` - required, the key you can `goto` when call the script.

- `CALL` - execute a sub-script.
  - `key` - required, `string`, the key to identify the stop point.
  - `script` - required, the sub-script.
  - `vars` - optional, `(Circumstance) => Vars`, set the vars used by sub-script.
  - `goto` - optional, `string`, begin execution from a label.
  - `set` - optional, `(Circumstance, Value) => Vars`, set `vars` according to the returned value.

- `RETURN` - exit current script.
  - `value` - optional, `(Circumstance) => Vars`, the value to return.

### Design a Dialog

`PROMPT` is the most important feature  to build a staged dialog experience. It split the dialog into different stages by hanging up until user respond.

Other keywords help you to handle the flow control of `PROMPT`. Like in the upper example:

```js
<>
...
  <WHILE
    condition={({ vars }) =>
      !MAIN_COURSES.includes(vars.mainCourse)
    }
  >
    {() => <p>We have {MAIN_COURSES.join(', ')}.</p>}

    <PROMPT
      key="ask-main-course"
      set={({ vars }, { event }) => ({
        ...vars,
        mainCourse: event.text,
      })}
    />
  </WHILE>
...
</>
```

`WHILE` defines the condition and the block to be looped containing a `PROMPT`. This make the bot keep asking user until a valid main course is chosen.

## Plugin the Script Processor

Before using scripts in your bot you must register all the scripts and the processor service first:


```js
import Machiant from '@machinat/core';
import Script from '@machinat/script';
// your built scripts
import FirstDate from './scenes/FirstDate';
import FallInLove from './scenes/FallInLove';
import WWBegin from './scenes/WWBegin';


const app = Machiant.createApp({
  ...
  modules: [
    Script.initModule({
      libs: [
        FirstDate,
        FallInLove,
        WWBegin,
        ...
      ],
    })
  ]
});
```

Then add the following code in your event handler:

```js
import Script, { Execute } from '@machinat/script';

app.onEvent(
  container({
    deps: [Script.Processor] }
  )(processor => async context => {
    const { channel, bot } = context;

    // check if any script is running
    const runtime = await processor.continue(channel);
    if (runtime) {
      // execute from the prompt point
      return bot.render(
        channel,
        <Execute runtime={runtime} input={context} />
      );
    }
    // logic while not running ...
  })
);
```

The code above intercept the event if any script is running and prompting on the channel. While no script is running, you can respond any message or start a script with:

```js
bot.render(channel, <MyScript.Init channel={channel} />);
```

### 

### Execute Time and Render Time

While a dialog processing, this two things about the content happen in order:

1. content function is called and returns the message while being met.
2. messages from content nodes at current stage is rendered (and sent).

You can see the 2 steps happens at different time, _execute time_ and _render time_. Flow related logic like asking a question before `PROMPT` can be handled at execute time by a content node. How to present a question then can be determined at render time later by the element returned.
