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

it('work', () => {
  const ChildScript = build(
    'ChildScript',
    <>
      {() => <dolore />}
      <PROMPT setter={(_, ctx) => ({ x: ctx.x })} key="childPrompt" />
    </>
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
            <PROMPT key="ask_1" setter={(_, ctx) => ({ a: ctx.a })} />
          </WHILE>
        </THEN>
        <ELSE_IF condition={() => true}>
          <LABEL key="second" />
          {() => <dolor />}
          <PROMPT key="ask_2" setter={(_, ctx) => ({ b: ctx.b })} />
          <RETURN />
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
      <VARS set={_ => ({ foo: 'bar' })} />
      {() => 'ad minim veniam'}
    </>
  );

  expect(MyScript.name).toBe('MyScript');
  expect(MyScript.$$typeof).toBe(MACHINAT_SCRIPT_TYPE);
  expect(typeof MyScript.Init).toBe('function');

  expect(MyScript.commands).toMatchSnapshot();
  expect(MyScript.entryPointIndex).toMatchInlineSnapshot(`
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
});
