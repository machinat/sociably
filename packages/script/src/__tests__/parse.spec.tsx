import Sociably from '@sociably/core';
import { SOCIABLY_SCRIPT_TYPE } from '../constant.js';
import {
  IF,
  ELSE_IF,
  ELSE,
  WHILE,
  PROMPT,
  LABEL,
  CALL,
  EFFECT,
  RETURN,
} from '../keyword.js';
import parse from '../parse.js';
import type { AnyScriptLibrary } from '../types.js';

const AnotherScript: AnyScriptLibrary = {
  $$typeof: SOCIABLY_SCRIPT_TYPE,
  name: 'AnotherScript',
  initVars: () => ({}),
  commands: [
    { type: 'content', getContent: () => '...' },
    { type: 'prompt', key: 'ask', setVars: () => ({}) },
  ],
  stopPointIndex: new Map([
    ['foo', 3],
    ['bar', 8],
  ]),
  Start: (() => {}) as never,
  meta: null,
};

it('parse content fn', () => {
  const segments: any = parse(
    <>
      {() => 'foo'}
      {() => 'bar'}
      {() => 'baz'}
    </>
  );
  expect(segments).toEqual([
    { type: 'content', getContent: expect.any(Function) },
    { type: 'content', getContent: expect.any(Function) },
    { type: 'content', getContent: expect.any(Function) },
  ]);
  expect(segments[0].getContent({})).toBe('foo');
  expect(segments[1].getContent({})).toBe('bar');
  expect(segments[2].getContent({})).toBe('baz');
});

describe('parse <IF/>', () => {
  it('parse ok', () => {
    const segments: any = parse(<IF condition={() => true}>{() => 'foo'}</IF>);
    expect(segments).toEqual([
      {
        type: 'conditions',
        branches: [
          {
            condition: expect.any(Function),
            body: [{ type: 'content', getContent: expect.any(Function) }],
          },
        ],
        fallbackBody: null,
      },
    ]);
    expect(segments[0].branches[0].condition()).toBe(true);
    expect(segments[0].branches[0].body[0].getContent()).toBe('foo');
  });

  it('parse with else', () => {
    const segments: any = parse(
      <>
        <IF condition={() => true}>{() => 'foo'}</IF>
        <ELSE>{() => 'bar'}</ELSE>
      </>
    );
    expect(segments).toEqual([
      {
        type: 'conditions',
        branches: [
          {
            condition: expect.any(Function),
            body: [{ type: 'content', getContent: expect.any(Function) }],
          },
        ],
        fallbackBody: [{ type: 'content', getContent: expect.any(Function) }],
      },
    ]);
    expect(segments[0].fallbackBody[0].getContent()).toBe('bar');
  });

  it('parse with else if conditions', () => {
    const segments: any = parse(
      <>
        <IF condition={() => true}>{() => 'foo'}</IF>
        <ELSE_IF condition={() => false}>{() => 'bar'}</ELSE_IF>
        <ELSE_IF condition={() => true}>{() => 'baz'}</ELSE_IF>
        <ELSE>{() => 'boom boom pow'}</ELSE>
      </>
    );
    expect(segments).toEqual([
      {
        type: 'conditions',
        branches: new Array(3).fill({
          condition: expect.any(Function),
          body: [{ type: 'content', getContent: expect.any(Function) }],
        }),
        fallbackBody: [{ type: 'content', getContent: expect.any(Function) }],
      },
    ]);
    expect(segments[0].branches[0].condition()).toBe(true);
    expect(segments[0].branches[0].body[0].getContent()).toBe('foo');
    expect(segments[0].branches[1].condition()).toBe(false);
    expect(segments[0].branches[1].body[0].getContent()).toBe('bar');
    expect(segments[0].branches[2].condition()).toBe(true);
    expect(segments[0].branches[2].body[0].getContent()).toBe('baz');
    expect(segments[0].fallbackBody[0].getContent()).toBe('boom boom pow');
  });

  it('parse nested <IF/>', () => {
    expect(
      parse(
        <>
          <IF condition={() => true}>
            {() => 'foo'}
            <IF condition={() => true}>{() => 'fooo'}</IF>
            {() => 'foooo'}
          </IF>
          <ELSE_IF condition={() => true}>
            {() => 'bar'}
            <IF condition={() => true}>{() => 'baar'}</IF>
            <ELSE_IF condition={() => true}>{() => 'baaar'}</ELSE_IF>
            {() => 'baaaar'}
          </ELSE_IF>
          <ELSE>
            {() => 'baz'}
            <IF condition={() => true}>{() => 'baaz'}</IF>
            <ELSE>{() => 'baaaz'}</ELSE>
            {() => 'baaaaz'}
          </ELSE>
        </>
      )
    ).toMatchSnapshot();
  });

  it('parse ok if no children blocks', () => {
    const conditionFn = () => true;
    expect(parse(<IF condition={conditionFn}>{null as never}</IF>)).toEqual([
      {
        type: 'conditions',
        branches: [{ condition: conditionFn, body: [] }],
        fallbackBody: null,
      },
    ]);
  });

  it('throw if condition is not a function', () => {
    expect(() =>
      parse(<IF condition={null as never}>{[]}</IF>)
    ).toThrowErrorMatchingInlineSnapshot(
      `"prop "condition" of <IF/> should be a function"`
    );
  });

  it('throw if <ELSE/> is not behind <IF/> or <IF_ELSE/>', () => {
    expect(() =>
      parse(<ELSE>{() => 'baz'}</ELSE>)
    ).toThrowErrorMatchingInlineSnapshot(
      `"<ELSE/> should be placed right after <IF/> or <ELSE_IF> block"`
    );
  });

  it('throw if multiple <ELSE/> received', () => {
    expect(() =>
      parse(
        <>
          <IF condition={() => true}>{() => 'foo'}</IF>
          <ELSE>{() => 'bar'}</ELSE>
          <ELSE>{() => 'baz'}</ELSE>
        </>
      )
    ).toThrowErrorMatchingInlineSnapshot(
      `"<ELSE/> should be placed right after <IF/> or <ELSE_IF> block"`
    );
  });

  it('throw if <ELSE_IF/> not after <THEN/> and before <ELSE/>', () => {
    expect(() =>
      parse(
        <>
          <IF condition={() => true}>{() => 'foo'}</IF>
          <ELSE>{() => 'baz'}</ELSE>
          <ELSE_IF condition={() => true}>{() => 'bar'}</ELSE_IF>
        </>
      )
    ).toThrowErrorMatchingInlineSnapshot(
      `"<ELSE_IF/> should be placed right after <IF/> or <ELSE_IF> block"`
    );
  });

  it('throw if condition of <ELSE_IF/> is not a function', () => {
    expect(() =>
      parse(
        <>
          <IF condition={() => true}>{() => 'foo'}</IF>
          <ELSE_IF condition={null as never}>{() => 'bar'}</ELSE_IF>
        </>
      )
    ).toThrowErrorMatchingInlineSnapshot(
      `"prop "condition" of <ELSE_IF/> should be a function"`
    );
  });
});

describe('parse <WHILE/>', () => {
  it('parse ok', () => {
    const segments: any = parse(
      <WHILE condition={() => true}>{() => 'Gee'}</WHILE>
    );
    expect(segments).toEqual([
      {
        type: 'while',
        condition: expect.any(Function),
        body: [{ type: 'content', getContent: expect.any(Function) }],
      },
    ]);
    expect(segments[0].condition({})).toBe(true);
    expect(segments[0].body[0].getContent({})).toBe('Gee');
  });

  it('parse nested <WHILE/>', () => {
    const segments: any = parse(
      <WHILE condition={() => true}>
        <WHILE condition={() => false}>{() => 'Goo'}</WHILE>
      </WHILE>
    );
    expect(segments).toEqual([
      {
        type: 'while',
        condition: expect.any(Function),
        body: [
          {
            type: 'while',
            condition: expect.any(Function),
            body: [{ type: 'content', getContent: expect.any(Function) }],
          },
        ],
      },
    ]);
    expect(segments[0].condition({})).toBe(true);
    expect(segments[0].body[0].condition({})).toBe(false);
    expect(segments[0].body[0].body[0].getContent({})).toBe('Goo');
  });

  it('throw if condition prop is not a function', () => {
    expect(() =>
      parse(<WHILE condition={'true' as never}>{() => 'foo'}</WHILE>)
    ).toThrowErrorMatchingInlineSnapshot(
      `"prop "condition" of <WHILE/> should be a function"`
    );
  });
});

describe('parse <EFFECT/>', () => {
  it('parse ok', () => {
    const helloSetter = () => ({ hello: 'world' });
    const yieldSomething = () => 'foo';
    expect(
      parse(
        <>
          <EFFECT yield={yieldSomething} set={helloSetter} />
          <EFFECT set={helloSetter} />
          <EFFECT yield={yieldSomething} />
        </>
      )
    ).toEqual([
      { type: 'effect', setVars: helloSetter, yieldValue: yieldSomething },
      { type: 'effect', setVars: helloSetter },
      { type: 'effect', yieldValue: yieldSomething },
    ]);
  });
});

describe('parse <PROMPT/>', () => {
  it('parse ok', () => {
    const answerSetter = (_, { event: { text } }) => ({ answer: text });

    expect(
      parse(
        <>
          {() => 'where r u last night?'}
          <PROMPT set={answerSetter} key="where" />
          {() => 'what r u doing?'}
          <PROMPT set={answerSetter} key="what" />
          {() => 'how can you do this to me?'}
          <PROMPT set={answerSetter} key="how" />
        </>
      )
    ).toEqual([
      { type: 'content', getContent: expect.any(Function) },
      { type: 'prompt', key: 'where', setVars: answerSetter },
      { type: 'content', getContent: expect.any(Function) },
      { type: 'prompt', key: 'what', setVars: answerSetter },
      { type: 'content', getContent: expect.any(Function) },
      { type: 'prompt', key: 'how', setVars: answerSetter },
    ]);
  });

  it('throw if key is empty', () => {
    expect(() =>
      parse(<PROMPT key={undefined as never} />)
    ).toThrowErrorMatchingInlineSnapshot(
      `"prop "key" of <PROMPT/> should not be empty"`
    );
    expect(() => parse(<PROMPT key="" />)).toThrowErrorMatchingInlineSnapshot(
      `"prop "key" of <PROMPT/> should not be empty"`
    );
  });
});

describe('parse <LABEL/>', () => {
  it('parse ok', () => {
    expect(
      parse(
        <>
          <LABEL key="foo" />
          {() => 'foo'}
        </>
      )
    ).toEqual([
      { type: 'label', key: 'foo' },
      { type: 'content', getContent: expect.any(Function) },
    ]);

    expect(
      parse(
        <>
          <LABEL key="bar" />
          {() => 'bar'}
          <LABEL key="baz" />
          {() => 'baz'}
        </>
      )
    ).toEqual([
      { type: 'label', key: 'bar' },
      { type: 'content', getContent: expect.any(Function) },
      { type: 'label', key: 'baz' },
      { type: 'content', getContent: expect.any(Function) },
    ]);
  });

  it('throw if key is empyt', () => {
    expect(() =>
      parse(<LABEL key={undefined as never} />)
    ).toThrowErrorMatchingInlineSnapshot(
      `"prop "key" of <LABEL/> should not be empty"`
    );
    expect(() => parse(<LABEL key="" />)).toThrowErrorMatchingInlineSnapshot(
      `"prop "key" of <LABEL/> should not be empty"`
    );
    expect(() =>
      parse(<LABEL key={null as never} />)
    ).toThrowErrorMatchingInlineSnapshot(
      `"prop "key" of <LABEL/> should not be empty"`
    );
  });
});

describe('parse <CALL/>', () => {
  it('parse ok', () => {
    const getCallVars = () => ({ hi: 'yo' });
    const setFromReturn = () => ({ foo: 'bar' });
    expect(
      parse(
        <>
          {() => 'hello'}
          <CALL script={AnotherScript} key="waiting" />
        </>
      )
    ).toEqual([
      { type: 'content', getContent: expect.any(Function) },
      {
        type: 'call',
        script: AnotherScript,
        key: 'waiting',
      },
    ]);
    expect(
      parse(
        <>
          {() => 'hello'}
          <CALL
            script={AnotherScript}
            params={getCallVars}
            set={setFromReturn}
            goto="foo"
            key="waiting"
          />
        </>
      )
    ).toEqual([
      { type: 'content', getContent: expect.any(Function) },
      {
        type: 'call',
        script: AnotherScript,
        withParams: getCallVars,
        setVars: setFromReturn,
        goto: 'foo',
        key: 'waiting',
      },
    ]);
  });

  it('throw if non-script received', () => {
    expect(() =>
      parse(
        <CALL
          script={{ something: 'wrong' } as any}
          key="call_another_script"
        />
      )
    ).toThrowErrorMatchingInlineSnapshot(
      `"invalid "script" prop received on <CALL/>"`
    );
  });

  it('throw if key is empty', () => {
    expect(() =>
      parse(<CALL key={undefined as never} script={AnotherScript} />)
    ).toThrowErrorMatchingInlineSnapshot(
      `"prop "key" of <CALL/> should not be empty"`
    );
  });

  it('throw if goto key not existed', () => {
    expect(() =>
      parse(
        <CALL
          script={AnotherScript}
          key="call_another_script"
          goto="not_existed_key"
        />
      )
    ).toThrowErrorMatchingInlineSnapshot(
      `"key "not_existed_key" not found in AnotherScript"`
    );
  });
});

test('parse <RETURN/>', () => {
  expect(
    parse(
      <>
        {() => 'foo'}
        <RETURN />
        {() => 'bar'}
      </>
    )
  ).toEqual([
    { type: 'content', getContent: expect.any(Function) },
    { type: 'return' },
    { type: 'content', getContent: expect.any(Function) },
  ]);

  const getValue = ({ vars }) => vars.foo;
  expect(parse(<RETURN value={getValue} />)).toEqual([
    { type: 'return', getValue },
  ]);
});

test('parse whole script', () => {
  expect(
    parse(
      <>
        <LABEL key="start" />
        {() => <b>Lorem</b>}

        <IF condition={() => false}>
          <LABEL key="1st" />

          <WHILE condition={() => true}>
            {() => <i>ipsum</i>}

            <PROMPT
              key="ask_1"
              set={({ vars }, ctx) => ({ ...vars, a: ctx.a })}
            />
          </WHILE>
        </IF>
        <ELSE_IF condition={() => true}>
          {() => 'sed do'}
          <IF condition={() => false}>
            {() => <eiusmod />}

            <PROMPT
              key="ask_2"
              set={({ vars }, ctx) => ({ ...vars, c: ctx.c })}
            />
          </IF>
          <ELSE>{() => 'tempor'}</ELSE>
        </ELSE_IF>
        <ELSE>
          {() => 'sit amet,'}
          <CALL
            key="call_1"
            script={AnotherScript}
            params={() => ({ x: 'xxxx' })}
            set={() => ({ from: 'another script' })}
            goto="bar"
          />
        </ELSE>

        <EFFECT set={({ vars }) => ({ ...vars, foo: 'bar' })} />
        <LABEL key="2nd" />
        {() => 'consectetur'}

        <EFFECT yield={({ vars }) => `hello ${vars.foo}`} />
        <LABEL key="3rd" />
        {() => <del>incididunt</del>}

        <WHILE condition={() => false}>
          {() => 'ut labore et'}
          <IF condition={() => false}>
            <LABEL key="4th" />

            {() => <dolore />}
            <PROMPT
              key="ask_3"
              set={({ vars }, ctx) => ({ ...vars, d: ctx.d })}
            />
          </IF>
          <ELSE>
            <RETURN value={() => 'fooo'} />
          </ELSE>
        </WHILE>

        {() => <a>Ut enim</a>}
        <CALL
          key="call_2"
          script={AnotherScript}
          params={() => ({ foo: 'baz' })}
          goto="foo"
        />

        <LABEL key="end" />
        <PROMPT key="ask_4" set={() => ({ end: true })} />

        <EFFECT
          yield={({ vars }) => `hello ${vars.foo}`}
          set={() => ({ foo: 'bae' })}
        />
        {() => 'ad minim veniam'}
      </>
    )
  ).toMatchSnapshot();
});

it('throw if invalid syntax node received', () => {
  expect(() => parse('hello' as never)).toThrowErrorMatchingInlineSnapshot(
    `"invalid script node: "hello""`
  );

  expect(() => parse(<world />)).toThrowErrorMatchingInlineSnapshot(
    `"unknown keyword: <world />"`
  );

  const Foo = () => <></>;
  expect(() => parse(<Foo />)).toThrowErrorMatchingInlineSnapshot(
    `"unknown keyword: <Foo />"`
  );
});
