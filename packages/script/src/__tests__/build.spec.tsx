import { moxy } from '@moxyjs/moxy';
import Sociably, { RenderingTarget } from '@sociably/core';
import { isContainerType } from '@sociably/core/utils';
import ProcessorP from '../Processor.js';
import build from '../build.js';
import { SOCIABLY_SCRIPT_TYPE } from '../constant.js';
import {
  IF,
  ELSE_IF,
  ELSE,
  WHILE,
  PROMPT,
  EFFECT,
  LABEL,
  CALL,
  RETURN,
} from '../keyword.js';

const initVars = moxy(() => ({}));

const thread = { platform: 'test', uid: 'foo.thread' };

const ChildScript = build(
  {
    name: 'ChildScript',
    initVars,
  },
  <>
    {() => <dolore />}
    <PROMPT set={(_, ctx) => ({ x: ctx.x })} key="childPrompt" />
  </>
);

const MyScript = build(
  {
    name: 'MyScript',
    initVars,
    meta: { foo: 'bar' },
  },
  <>
    <LABEL key="start" />
    {() => <b>Lorem</b>}

    <IF condition={() => false}>
      <WHILE condition={() => true}>
        <LABEL key="first" />
        {() => <i>ipsum</i>}
        <PROMPT key="ask_1" set={(_, ctx) => ({ a: ctx.a })} />
      </WHILE>
    </IF>
    <ELSE_IF condition={() => true}>
      <LABEL key="second" />
      {() => <dolor />}
      <PROMPT key="ask_2" set={(_, ctx) => ({ b: ctx.b })} />
      <RETURN value={() => 'fooo'} />
    </ELSE_IF>
    <ELSE>
      <LABEL key="third" />
      {() => 'sit amet,'}
      <CALL
        script={ChildScript}
        params={() => ({ foo: 'bar' })}
        goto="childPrompt"
        key="call_1"
      />
    </ELSE>

    <LABEL key="end" />
    <EFFECT set={() => ({ foo: 'bar' })} />
    {() => 'ad minim veniam'}
  </>
);

test('Script object', () => {
  expect(MyScript.name).toBe('MyScript');
  expect(MyScript.$$typeof).toBe(SOCIABLY_SCRIPT_TYPE);

  expect(MyScript.commands).toMatchSnapshot();
  expect(MyScript.initVars).toBe(initVars);
  expect(MyScript.stopPointIndex).toMatchInlineSnapshot(`
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
  expect(ChildScript.$$typeof).toBe(SOCIABLY_SCRIPT_TYPE);

  expect(ChildScript.commands).toMatchSnapshot();
  expect(ChildScript.initVars).toBe(initVars);
  expect(ChildScript.stopPointIndex).toMatchInlineSnapshot(`
    Map {
      "childPrompt" => 1,
    }
  `);
});

test('Script.Start', () => {
  const mockProcessor = moxy({
    start: async () => ({ output: () => 'Hello Script' }),
  });

  expect(typeof MyScript.Start).toBe('function');
  expect(isContainerType(<MyScript.Start />)).toBe(true);
  expect(MyScript.Start.$$name).toBe('MyScript');
  expect(MyScript.Start.$$deps).toEqual([
    { require: ProcessorP, optional: false },
    { require: RenderingTarget, optional: false },
  ]);

  expect((MyScript.Start as any)(mockProcessor, thread)({})).resolves.toBe(
    'Hello Script'
  );
  expect(mockProcessor.start).toHaveBeenCalledTimes(1);
  expect(mockProcessor.start).toHaveBeenCalledWith(thread, MyScript, {});

  expect(typeof ChildScript.Start).toBe('function');
  expect(isContainerType(<ChildScript.Start />)).toBe(true);
  expect(ChildScript.Start.$$name).toBe('ChildScript');

  expect(
    (ChildScript.Start as any)(
      mockProcessor,
      thread
    )({
      params: { foo: 'baz' },
      goto: 'bar',
    })
  ).resolves.toBe('Hello Script');
  expect(mockProcessor.start).toHaveBeenCalledTimes(2);
  expect(mockProcessor.start).toHaveBeenCalledWith(thread, ChildScript, {
    params: { foo: 'baz' },
    goto: 'bar',
  });
});
