import Machinat from '@machinat/core';
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
import parse from '../parse';

const AnotherScript = {
  $$typeof: MACHINAT_SCRIPT_TYPE,
  name: 'AnotherScript',
  commands: [
    { type: 'content', render: () => '...' },
    { type: 'prompt', key: 'ask' },
  ],
  entriesIndex: new Map([
    ['foo', 3],
    ['bar', 8],
  ]),
};

it('parse content rendering fn', () => {
  const segments = parse(
    <>
      {() => 'foo'}
      {() => 'bar'}
      {() => 'baz'}
    </>
  );
  expect(segments).toEqual([
    { type: 'content', render: expect.any(Function) },
    { type: 'content', render: expect.any(Function) },
    { type: 'content', render: expect.any(Function) },
  ]);
  expect(segments[0].render({})).toBe('foo');
  expect(segments[1].render({})).toBe('bar');
  expect(segments[2].render({})).toBe('baz');
});

describe('parse <IF/>', () => {
  it('parse ok', () => {
    const segments = parse(
      <IF condition={() => true}>
        <THEN>{() => 'foo'}</THEN>
      </IF>
    );
    expect(segments).toEqual([
      {
        type: 'conditions',
        branches: [
          {
            condition: expect.any(Function),
            body: [{ type: 'content', render: expect.any(Function) }],
          },
        ],
        fallbackBody: null,
      },
    ]);
    expect(segments[0].branches[0].condition()).toBe(true);
    expect(segments[0].branches[0].body[0].render()).toBe('foo');
  });

  it('parse with else', () => {
    const segments = parse(
      <IF condition={() => true}>
        <THEN>{() => 'foo'}</THEN>
        <ELSE>{() => 'bar'}</ELSE>
      </IF>
    );
    expect(segments).toEqual([
      {
        type: 'conditions',
        branches: [
          {
            condition: expect.any(Function),
            body: [{ type: 'content', render: expect.any(Function) }],
          },
        ],
        fallbackBody: [{ type: 'content', render: expect.any(Function) }],
      },
    ]);
    expect(segments[0].fallbackBody[0].render()).toBe('bar');
  });

  it('parse with else if conditions', () => {
    const segments = parse(
      <IF condition={() => true}>
        <THEN>{() => 'foo'}</THEN>
        <ELSE_IF condition={() => false}>{() => 'bar'}</ELSE_IF>
        <ELSE_IF condition={() => true}>{() => 'baz'}</ELSE_IF>
        <ELSE>{() => 'boom boom pow'}</ELSE>
      </IF>
    );
    expect(segments).toEqual([
      {
        type: 'conditions',
        branches: new Array(3).fill({
          condition: expect.any(Function),
          body: [{ type: 'content', render: expect.any(Function) }],
        }),
        fallbackBody: [{ type: 'content', render: expect.any(Function) }],
      },
    ]);
    expect(segments[0].branches[0].condition()).toBe(true);
    expect(segments[0].branches[0].body[0].render()).toBe('foo');
    expect(segments[0].branches[1].condition()).toBe(false);
    expect(segments[0].branches[1].body[0].render()).toBe('bar');
    expect(segments[0].branches[2].condition()).toBe(true);
    expect(segments[0].branches[2].body[0].render()).toBe('baz');
    expect(segments[0].fallbackBody[0].render()).toBe('boom boom pow');
  });

  it('parse nested <IF/>', () => {
    expect(
      parse(
        <IF condition={() => true}>
          <THEN>
            {() => 'foo'}
            <IF condition={() => true}>
              <THEN>{() => 'fooo'}</THEN>
            </IF>
            {() => 'foooo'}
          </THEN>
          <ELSE_IF condition={() => true}>
            {() => 'bar'}
            <IF condition={() => true}>
              <THEN>{() => 'baar'}</THEN>
              <ELSE_IF condition={() => true}>{() => 'baaar'}</ELSE_IF>
            </IF>
            {() => 'baaaar'}
          </ELSE_IF>
          <ELSE>
            {() => 'baz'}
            <IF condition={() => true}>
              <THEN>{() => 'baaz'}</THEN>
              <ELSE>{() => 'baaaz'}</ELSE>
            </IF>
            {() => 'baaaaz'}
          </ELSE>
        </IF>
      )
    ).toMatchSnapshot();
  });

  it('parse ok if no children blocks', () => {
    expect(parse(<IF condition={() => true}></IF>)).toEqual([
      { type: 'conditions', branches: [], fallbackBody: null },
    ]);
  });

  it('throw if condition is not a function', () => {
    expect(() => parse(<IF></IF>)).toThrowErrorMatchingInlineSnapshot(
      `"prop \\"condition\\" of <IF/> should be a function"`
    );
  });

  it('throw if non THEN, ELSE_IF, ELSE block node contained', () => {
    expect(() =>
      parse(<IF condition={() => true}>hello</IF>)
    ).toThrowErrorMatchingInlineSnapshot(
      `"only THEN, ELSE_IF, ELSE elements are afccepted within children of <IF/>, got: \\"hello\\""`
    );
    expect(() =>
      parse(
        <IF condition={() => true}>
          <PROMPT />
        </IF>
      )
    ).toThrowErrorMatchingInlineSnapshot(
      `"only THEN, ELSE_IF, ELSE elements are afccepted within children of <IF/>, got: <PROMPT />"`
    );
  });

  it('throw if multiple <THEN/> received', () => {
    expect(() =>
      parse(
        <IF condition={() => true}>
          <THEN>{() => 'bar'}</THEN>
          <THEN>{() => 'foo'}</THEN>
        </IF>
      )
    ).toThrowErrorMatchingInlineSnapshot(
      `"<THEN /> should be the first block wihtin <IF />"`
    );
  });

  it('throw if no <THEN/> provided', () => {
    expect(() =>
      parse(
        <IF condition={() => true}>
          <ELSE>{() => 'baz'}</ELSE>
        </IF>
      )
    ).toThrowErrorMatchingInlineSnapshot(`"no <THEN/> block before <ELSE/>"`);
  });

  it('throw if multiple <ELSE/> received', () => {
    expect(() =>
      parse(
        <IF condition={() => true}>
          <THEN>{() => 'foo'}</THEN>
          <ELSE>{() => 'bar'}</ELSE>
          <ELSE>{() => 'baz'}</ELSE>
        </IF>
      )
    ).toThrowErrorMatchingInlineSnapshot(
      `"multiple <ELSE/> block received in <IF/>"`
    );
  });

  it('throw if <ELSE_IF/> not after <THEN/> and before <ELSE/>', () => {
    expect(() =>
      parse(
        <IF condition={() => true}>
          <THEN>{() => 'foo'}</THEN>
          <ELSE>{() => 'baz'}</ELSE>
          <ELSE_IF condition={() => true}>{() => 'bar'}</ELSE_IF>
        </IF>
      )
    ).toThrowErrorMatchingInlineSnapshot(
      `"<ELSE_IF /> should be placed between <THEN /> and <ELSE /> blocks"`
    );
    expect(() =>
      parse(
        <IF condition={() => true}>
          <ELSE_IF condition={() => true}>{() => 'bar'}</ELSE_IF>
          <THEN>{() => 'foo'}</THEN>
          <ELSE>{() => 'baz'}</ELSE>
        </IF>
      )
    ).toThrowErrorMatchingInlineSnapshot(
      `"<ELSE_IF /> should be placed between <THEN /> and <ELSE /> blocks"`
    );
  });

  it('throw if condition of <ELSE_IF/> is not a function', () => {
    expect(() =>
      parse(
        <IF condition={() => true}>
          <THEN>{() => 'foo'}</THEN>
          <ELSE_IF>{() => 'bar'}</ELSE_IF>
        </IF>
      )
    ).toThrowErrorMatchingInlineSnapshot(
      `"prop \\"condition\\" of <ELSE_IF/> should be a function"`
    );
  });
});

describe('parse <WHILE/>', () => {
  it('parse ok', () => {
    const segments = parse(<WHILE condition={() => true}>{() => 'Gee'}</WHILE>);
    expect(segments).toEqual([
      {
        type: 'while',
        condition: expect.any(Function),
        body: [{ type: 'content', render: expect.any(Function) }],
      },
    ]);
    expect(segments[0].condition({})).toBe(true);
    expect(segments[0].body[0].render({})).toBe('Gee');
  });

  it('parse nested <WHILE/>', () => {
    const segments = parse(
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
            body: [{ type: 'content', render: expect.any(Function) }],
          },
        ],
      },
    ]);
    expect(segments[0].condition({})).toBe(true);
    expect(segments[0].body[0].condition({})).toBe(false);
    expect(segments[0].body[0].body[0].render({})).toBe('Goo');
  });

  it('throw if condition prop is not a function', () => {
    expect(() =>
      parse(<WHILE condition="true">{() => 'foo'}</WHILE>)
    ).toThrowErrorMatchingInlineSnapshot(
      `"prop \\"condition\\" of <WHILE/> should be a function"`
    );
  });
});

describe('parse <VARS/>', () => {
  it('parse ok', () => {
    const helloSetter = () => ({ hello: 'world' });
    const greetedSetter = () => ({ greeted: true });
    expect(
      parse(
        <>
          <VARS set={helloSetter} />
          {({ vars }) => `hello ${vars.hello}`}
          <VARS set={greetedSetter} />
        </>
      )
    ).toEqual([
      { type: 'set_vars', setter: helloSetter },
      { type: 'content', render: expect.any(Function) },
      { type: 'set_vars', setter: greetedSetter },
    ]);
  });

  it('throw if set is empty', () => {
    expect(() => parse(<VARS />)).toThrowErrorMatchingInlineSnapshot(
      `"prop \\"set\\" of <VARS/> should be a function"`
    );
    expect(() => parse(<VARS set={null} />)).toThrowErrorMatchingInlineSnapshot(
      `"prop \\"set\\" of <VARS/> should be a function"`
    );
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
      { type: 'content', render: expect.any(Function) },
      { type: 'prompt', key: 'where', setter: answerSetter },
      { type: 'content', render: expect.any(Function) },
      { type: 'prompt', key: 'what', setter: answerSetter },
      { type: 'content', render: expect.any(Function) },
      {
        type: 'prompt',
        key: 'how',
        setter: answerSetter,
      },
    ]);
  });

  it('throw if key is empty', () => {
    expect(() =>
      parse(<PROMPT set={() => ({ answer: 'text' })} />)
    ).toThrowErrorMatchingInlineSnapshot(
      `"prop \\"key\\" of <PROMPT/> should not be empty"`
    );
    expect(() => parse(<PROMPT key="" />)).toThrowErrorMatchingInlineSnapshot(
      `"prop \\"key\\" of <PROMPT/> should not be empty"`
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
      { type: 'content', render: expect.any(Function) },
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
      { type: 'content', render: expect.any(Function) },
      { type: 'label', key: 'baz' },
      { type: 'content', render: expect.any(Function) },
    ]);
  });

  it('throw if key is empyt', () => {
    expect(() => parse(<LABEL />)).toThrowErrorMatchingInlineSnapshot(
      `"prop \\"key\\" of <LABEL/> should not be empty"`
    );
    expect(() => parse(<LABEL key="" />)).toThrowErrorMatchingInlineSnapshot(
      `"prop \\"key\\" of <LABEL/> should not be empty"`
    );
    expect(() =>
      parse(<LABEL key={null} />)
    ).toThrowErrorMatchingInlineSnapshot(
      `"prop \\"key\\" of <LABEL/> should not be empty"`
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
      { type: 'content', render: expect.any(Function) },
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
            withVars={getCallVars}
            set={setFromReturn}
            goto="foo"
            key="waiting"
          />
        </>
      )
    ).toEqual([
      { type: 'content', render: expect.any(Function) },
      {
        type: 'call',
        script: AnotherScript,
        withVars: getCallVars,
        setter: setFromReturn,
        goto: 'foo',
        key: 'waiting',
      },
    ]);
  });

  it('throw if non-script received', () => {
    expect(() =>
      parse(<CALL key="call_another_script" script={{ something: 'wrong' }} />)
    ).toThrowErrorMatchingInlineSnapshot(
      `"invalid \\"script\\" prop received on <CALL/>"`
    );
  });

  it('throw if key is empty', () => {
    expect(() =>
      parse(<CALL script={AnotherScript} />)
    ).toThrowErrorMatchingInlineSnapshot(
      `"prop \\"key\\" of <CALL/> should not be empty"`
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
      `"key \\"not_existed_key\\" not found in AnotherScript"`
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
    { type: 'content', render: expect.any(Function) },
    { type: 'return' },
    { type: 'content', render: expect.any(Function) },
  ]);

  expect(parse(<RETURN value={({ vars }) => vars.foo} />)).toEqual([
    { type: 'return', valueGetter: expect.any(Function) },
  ]);
});

test('parse whole script', () => {
  expect(
    parse(
      <>
        <LABEL key="start" />
        {() => <b>Lorem</b>}

        <IF condition={() => false}>
          <THEN>
            <LABEL key="1st" />

            <WHILE condition={() => true}>
              {() => <i>ipsum</i>}

              <PROMPT
                key="ask_1"
                set={({ vars }, ctx) => ({ ...vars, a: ctx.a })}
              />
            </WHILE>
          </THEN>
          <ELSE_IF condition={() => true}>
            {() => 'sed do'}
            <IF condition={() => false}>
              <THEN>
                {() => <eiusmod />}

                <PROMPT
                  key="ask_2"
                  set={({ vars }, ctx) => ({ ...vars, c: ctx.c })}
                />
              </THEN>
              <ELSE>{() => 'tempor'}</ELSE>
            </IF>
          </ELSE_IF>
          <ELSE>
            {() => 'sit amet,'}
            <CALL
              key="call_1"
              script={AnotherScript}
              withVars={() => ({ x: 'xxxx' })}
              set={() => ({ from: 'another script' })}
              goto="bar"
            />
          </ELSE>
        </IF>

        <VARS set={({ vars }) => ({ ...vars, foo: 'bar' })} />
        <LABEL key="2nd" />
        {() => 'consectetur'}

        <VARS set={({ vars }) => ({ ...vars, foo: 'baz' })} />
        <LABEL key="3rd" />
        {() => <del>incididunt</del>}

        <WHILE condition={() => false}>
          {() => 'ut labore et'}
          <IF condition={() => false}>
            <THEN>
              <LABEL key="4th" />

              {() => <dolore />}
              <PROMPT
                key="ask_3"
                set={({ vars }, ctx) => ({ ...vars, d: ctx.d })}
              />
            </THEN>
            <ELSE>
              <RETURN value={() => 'fooo'} />
            </ELSE>
          </IF>
        </WHILE>

        {() => <a>Ut enim</a>}
        <CALL
          key="call_2"
          script={AnotherScript}
          withVars={() => ({ foo: 'baz' })}
          goto="foo"
        />

        <LABEL key="end" />
        <PROMPT key="ask_4" set={() => ({ end: true })} />
        {() => 'ad minim veniam'}
      </>
    )
  ).toMatchSnapshot();
});

it('throw if invalid syntax node received', () => {
  expect(() => parse('hello')).toThrowErrorMatchingInlineSnapshot(
    `"invalid script node: \\"hello\\""`
  );

  expect(() => parse(<world />)).toThrowErrorMatchingInlineSnapshot(
    `"unexpected element: <world />"`
  );

  const Foo = () => {};
  expect(() => parse(<Foo />)).toThrowErrorMatchingInlineSnapshot(
    `"unexpected element: <Foo />"`
  );

  expect(() => parse(<THEN />)).toThrowErrorMatchingInlineSnapshot(
    `"unexpected keyword: <THEN />"`
  );
});
