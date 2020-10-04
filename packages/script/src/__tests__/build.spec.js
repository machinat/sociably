import moxy from '@moxyjs/moxy';
import Machinat from '@machinat/core';
import build from '../build';
import { MACHINAT_SCRIPT_TYPE } from '../constant';
import {
  IF,
  THEN,
  ELSE_IF,
  ELSE,
  WHILE,
  PROMPT,
  VARS,
  LABEL,
  CALL,
  RETURN,
} from '../keyword';

test('built script object', () => {
  const ChildScript = build(
    'ChildScript',
    <>
      {() => <dolore />}
      <PROMPT
        filter={(_, ctx) => ctx.x}
        set={(_, ctx) => ({ x: ctx.x })}
        key="childPrompt"
      />
    </>,
    { meta: { foo: 'baz' } }
  );

  const MyScript = build(
    'MyScript',
    <>
      <LABEL key="start" />
      {() => <b>Lorem</b>}

      <IF condition={() => false} key="if">
        <THEN>
          <WHILE condition={() => true}>
            <LABEL key="first" />
            {() => <i>ipsum</i>}
            <PROMPT
              key="ask_1"
              filter={(_, ctx) => ctx.a}
              set={(_, ctx) => ({ a: ctx.a })}
            />
          </WHILE>
        </THEN>
        <ELSE_IF condition={() => true}>
          <LABEL key="second" />
          {() => <dolor />}
          <PROMPT
            key="ask_2"
            filter={(_, ctx) => ctx.b}
            set={(_, ctx) => ({ b: ctx.b })}
          />
          <RETURN value={() => 'fooo'} />
        </ELSE_IF>
        <ELSE>
          <LABEL key="third" />
          {() => 'sit amet,'}
          <CALL
            script={ChildScript}
            withVars={() => ({ foo: 'bar' })}
            goto="childPrompt"
            key="call_1"
          />
        </ELSE>
      </IF>

      <LABEL key="end" />
      <VARS set={(_) => ({ foo: 'bar' })} />
      {() => 'ad minim veniam'}
    </>,
    { meta: { foo: 'bar' } }
  );

  expect(MyScript.name).toBe('MyScript');
  expect(MyScript.$$typeof).toBe(MACHINAT_SCRIPT_TYPE);
  expect(MyScript.Start).toBeInstanceOf(Function);

  expect(MyScript.commands).toMatchSnapshot();
  expect(MyScript.entriesIndex).toMatchInlineSnapshot(`
    Map {
      "start" => 0,
      "third" => 3,
      "call_1" => 4,
      "first" => 7,
      "ask_1" => 8,
      "second" => 11,
      "ask_2" => 12,
      "end" => 15,
    }
  `);
  expect(MyScript.meta).toEqual({ foo: 'bar' });

  expect(ChildScript.name).toBe('ChildScript');
  expect(ChildScript.$$typeof).toBe(MACHINAT_SCRIPT_TYPE);
  expect(ChildScript.Start).toBeInstanceOf(Function);

  expect(ChildScript.commands).toMatchSnapshot();
  expect(ChildScript.entriesIndex).toMatchInlineSnapshot(`
    Map {
      "childPrompt" => 1,
    }
    `);
  expect(ChildScript.meta).toEqual({ foo: 'baz' });
});

test('Start component', async () => {
  const HelloScript = build(
    'FooScript',
    <>
      {() => '...'}
      <LABEL key="HELLO" />
      {() => 'hello'}
      <PROMPT key="WORLD" />
      {() => 'world'}
    </>
  );

  const runtime = moxy({
    run: async () => ({
      finished: false,
      content: ['hello'],
      currentScript: HelloScript,
      stopAt: 'WORLD',
    }),
  });
  const processor = moxy({
    init: async () => runtime,
    save: async () => true,
  });

  const channel = { uid: '_FOO_CHANNEL_' };
  const renderPromise = HelloScript.Start(processor)({
    channel,
    vars: { foo: 'bar' },
    goto: 'HELLO',
  });

  await expect(renderPromise).resolves.toMatchInlineSnapshot(`
          Array [
            Array [
              "hello",
            ],
            <Machinat.Thunk
              effect={[Function]}
            />,
          ]
        `);

  expect(processor.init.mock).toHaveBeenCalledTimes(1);
  expect(processor.init.mock).toHaveBeenCalledWith(channel, HelloScript, {
    vars: { foo: 'bar' },
    goto: 'HELLO',
  });

  expect(runtime.run.mock).toHaveBeenCalledTimes(1);
  expect(runtime.run.mock).toHaveBeenCalledWith(/* empty */);

  expect(processor.save.mock).not.toHaveBeenCalled();

  const [, thunk] = await renderPromise;
  await thunk.props.effect();

  expect(processor.save.mock).toHaveBeenCalledTimes(1);
  expect(processor.save.mock).toHaveBeenCalledWith(runtime);
});