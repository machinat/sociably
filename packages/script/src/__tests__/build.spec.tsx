import moxy from '@moxyjs/moxy';
import Sociably, { RenderingChannel } from '@sociably/core';
import { isContainerType } from '@sociably/core/utils/isX';
import ProcessorP from '../processor';
import build from '../build';
import { SOCIABLY_SCRIPT_TYPE } from '../constant';
import {
  IF,
  THEN,
  ELSE_IF,
  ELSE,
  WHILE,
  PROMPT,
  EFFECT,
  LABEL,
  CALL,
  RETURN,
} from '../keyword';

const initVars = moxy(() => ({}));

const channel = { platform: 'test', uid: 'foo.channel' };

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
  },
  <>
    <LABEL key="start" />
    {() => <b>Lorem</b>}

    <IF condition={() => false}>
      <THEN>
        <WHILE condition={() => true}>
          <LABEL key="first" />
          {() => <i>ipsum</i>}
          <PROMPT key="ask_1" set={(_, ctx) => ({ a: ctx.a })} />
        </WHILE>
      </THEN>
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
    </IF>

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
    { require: RenderingChannel, optional: false },
  ]);

  expect((MyScript.Start as any)(mockProcessor, channel)({})).resolves.toBe(
    'Hello Script'
  );
  expect(mockProcessor.start.mock).toHaveBeenCalledTimes(1);
  expect(mockProcessor.start.mock).toHaveBeenCalledWith(channel, MyScript, {});

  expect(typeof ChildScript.Start).toBe('function');
  expect(isContainerType(<ChildScript.Start />)).toBe(true);
  expect(ChildScript.Start.$$name).toBe('ChildScript');

  expect(
    (ChildScript.Start as any)(
      mockProcessor,
      channel
    )({
      params: { foo: 'baz' },
      goto: 'bar',
    })
  ).resolves.toBe('Hello Script');
  expect(mockProcessor.start.mock).toHaveBeenCalledTimes(2);
  expect(mockProcessor.start.mock).toHaveBeenCalledWith(channel, ChildScript, {
    params: { foo: 'baz' },
    goto: 'bar',
  });
});
