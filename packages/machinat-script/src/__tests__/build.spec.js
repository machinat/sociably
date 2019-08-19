import Machinat from 'machinat';
import build from '../build';
import { MACHINAT_SCRIPT_TYPE } from '../constant';
import {
  If,
  Then,
  ElseIf,
  Else,
  For,
  While,
  Prompt,
  Vars,
  Label,
  Call,
} from '../keyword';

it('work', () => {
  const ChildScript = build(
    'ChildScript',
    <>
      {() => <dolore />}
      <Prompt setter={(_, frm) => ({ x: frm.x })} />
    </>
  );

  const MyScript = build(
    'MyScript',
    <>
      <Label key="start" />
      {() => <b>Lorem</b>}

      <If condition={() => false} key="if">
        <Then>
          <While condition={() => true}>
            <Label key="first" />
            {() => <i>ipsum</i>}
            <Prompt setter={(_, frm) => ({ a: frm.a })} />
          </While>
        </Then>
        <ElseIf condition={() => true}>
          <For var="n" of={() => [1, 2, 3]}>
            <Label key="second" />
            {() => <dolor />}
            <Prompt setter={(_, frm) => ({ b: frm.b })} />
          </For>
        </ElseIf>
        <Else>
          <Label key="third" />
          {() => 'sit amet,'}
          <Call
            script={ChildScript}
            withVars={() => ({ foo: 'bar' })}
            goto="xxx"
          />
        </Else>
      </If>

      <Label key="end" />
      <Vars set={_ => ({ foo: 'bar' })} />
      {() => 'ad minim veniam'}
    </>
  );

  expect(MyScript.name).toBe('MyScript');
  expect(MyScript.$$typeof).toBe(MACHINAT_SCRIPT_TYPE);
  expect(typeof MyScript.Init).toBe('function');

  expect(MyScript._commands).toMatchSnapshot();
  expect(MyScript._keyMapping).toMatchInlineSnapshot(`
    Object {
      "end": 18,
      "first": 7,
      "if": 1,
      "prompt#0": 8,
      "prompt#1": 14,
      "second": 13,
      "start": 0,
      "third": 3,
    }
  `);
});
