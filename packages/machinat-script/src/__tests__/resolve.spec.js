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
import resolve from '../resolve';

const AnotherScript = {
  $$typeof: MACHINAT_SCRIPT_TYPE,
  Init: () => '(Init)',
  name: 'AnotherScript',
  commands: [
    { type: 'content', render: () => '...' },
    { type: 'prompt', key: 'ask' },
  ],
  entryPointIndex: new Map([['foo', 3], ['bar', 8]]),
};

it('resolve content rendering fn', () => {
  const segments = resolve(
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

describe('resolve <IF/>', () => {
  it('resolve ok', () => {
    const segments = resolve(
      <IF condition={() => true}>
        <THEN>{() => 'foo'}</THEN>
      </IF>
    );
    expect(segments).toEqual([
      {
        type: 'if',
        branches: [
          {
            condition: expect.any(Function),
            body: [{ type: 'content', render: expect.any(Function) }],
          },
        ],
        fallback: undefined,
      },
    ]);
    expect(segments[0].branches[0].condition()).toBe(true);
    expect(segments[0].branches[0].body[0].render()).toBe('foo');
  });

  it('resolve with else', () => {
    const segments = resolve(
      <IF condition={() => true}>
        <THEN>{() => 'foo'}</THEN>
        <ELSE>{() => 'bar'}</ELSE>
      </IF>
    );
    expect(segments).toEqual([
      {
        type: 'if',
        branches: [
          {
            condition: expect.any(Function),
            body: [{ type: 'content', render: expect.any(Function) }],
          },
        ],
        fallback: [{ type: 'content', render: expect.any(Function) }],
      },
    ]);
    expect(segments[0].fallback[0].render()).toBe('bar');
  });

  it('resolve with else if conditions', () => {
    const segments = resolve(
      <IF condition={() => true}>
        <THEN>{() => 'foo'}</THEN>
        <ELSE_IF condition={() => false}>{() => 'bar'}</ELSE_IF>
        <ELSE_IF condition={() => true}>{() => 'baz'}</ELSE_IF>
        <ELSE>{() => 'boom boom pow'}</ELSE>
      </IF>
    );
    expect(segments).toEqual([
      {
        type: 'if',
        branches: new Array(3).fill({
          condition: expect.any(Function),
          body: [{ type: 'content', render: expect.any(Function) }],
        }),
        fallback: [{ type: 'content', render: expect.any(Function) }],
      },
    ]);
    expect(segments[0].branches[0].condition()).toBe(true);
    expect(segments[0].branches[0].body[0].render()).toBe('foo');
    expect(segments[0].branches[1].condition()).toBe(false);
    expect(segments[0].branches[1].body[0].render()).toBe('bar');
    expect(segments[0].branches[2].condition()).toBe(true);
    expect(segments[0].branches[2].body[0].render()).toBe('baz');
    expect(segments[0].fallback[0].render()).toBe('boom boom pow');
  });

  it('resolve nested <IF/>', () => {
    expect(
      resolve(
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

  it('resolve ok if no children blocks', () => {
    expect(resolve(<IF condition={() => true}></IF>)).toEqual([
      { type: 'if', branches: [] },
    ]);
  });

  it('throw if condition is not a function', () => {
    expect(() => resolve(<IF></IF>)).toThrowErrorMatchingInlineSnapshot(
      `"prop \\"condition\\" of <IF/> should be a function"`
    );
  });

  it('throw if non THEN, ELSE_IF, ELSE block node contained', () => {
    expect(() =>
      resolve(<IF condition={() => true}>hello</IF>)
    ).toThrowErrorMatchingInlineSnapshot(
      `"only <[THEN, ELSE_IF, ELSE]/> accepted within children of <IF/>, got: \\"hello\\""`
    );
    expect(() =>
      resolve(
        <IF condition={() => true}>
          <PROMPT />
        </IF>
      )
    ).toThrowErrorMatchingInlineSnapshot(
      `"only <[THEN, ELSE_IF, ELSE]/> accepted within children of <IF/>, got: <Symbol(machinat.script.keyword.prompt) />"`
    );
  });

  it('throw if multiple <THEN/> received', () => {
    expect(() =>
      resolve(
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
      resolve(
        <IF condition={() => true}>
          <ELSE>{() => 'baz'}</ELSE>
        </IF>
      )
    ).toThrowErrorMatchingInlineSnapshot(`"no <THEN/> block before <ELSE/>"`);
  });

  it('throw if multiple <ELSE/> received', () => {
    expect(() =>
      resolve(
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
      resolve(
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
      resolve(
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
      resolve(
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

describe('resolve <WHILE/>', () => {
  it('resolve ok', () => {
    const segments = resolve(
      <WHILE condition={() => true}>{() => 'Gee'}</WHILE>
    );
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

  it('resolve nested <WHILE/>', () => {
    const segments = resolve(
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
      resolve(<WHILE condition="true">{() => 'foo'}</WHILE>)
    ).toThrowErrorMatchingInlineSnapshot(
      `"prop \\"condition\\" of <WHILE/> should be a function"`
    );
  });
});

describe('resolve <VARS/>', () => {
  it('resolve ok', () => {
    const helloSetter = () => ({ hello: 'world' });
    const greetedSetter = () => ({ greeted: true });
    expect(
      resolve(
        <>
          <VARS set={helloSetter} />
          {vars => `hello ${vars.hello}`}
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
    expect(() => resolve(<VARS />)).toThrowErrorMatchingInlineSnapshot(
      `"prop \\"set\\" of <VARS/> should be a function"`
    );
    expect(() =>
      resolve(<VARS set={null} />)
    ).toThrowErrorMatchingInlineSnapshot(
      `"prop \\"set\\" of <VARS/> should be a function"`
    );
  });
});

describe('resolve <PROMPT/>', () => {
  it('resolve ok', () => {
    const answerSetter = (_, { event: { text } }) => ({ answer: text });
    expect(
      resolve(
        <>
          {() => 'but why!?'}
          <PROMPT set={answerSetter} key="why" />
        </>
      )
    ).toEqual([
      { type: 'content', render: expect.any(Function) },
      { type: 'prompt', setter: answerSetter, key: 'why' },
    ]);

    expect(
      resolve(
        <>
          {() => 'where r u last night?'}
          <PROMPT set={answerSetter} key="where" />
          {() => 'what r u doing?'}
          <PROMPT set={answerSetter} key="what" />
        </>
      )
    ).toEqual([
      { type: 'content', render: expect.any(Function) },
      { type: 'prompt', key: 'where', setter: answerSetter },
      { type: 'content', render: expect.any(Function) },
      { type: 'prompt', key: 'what', setter: answerSetter },
    ]);
  });

  it('throw if key is empty', () => {
    expect(() =>
      resolve(<PROMPT set={() => ({ answer: 'text' })} />)
    ).toThrowErrorMatchingInlineSnapshot(
      `"prop \\"key\\" of <PROMPT/> should not be empty"`
    );
    expect(() => resolve(<PROMPT key="" />)).toThrowErrorMatchingInlineSnapshot(
      `"prop \\"key\\" of <PROMPT/> should not be empty"`
    );
  });
});

describe('resolve <LABEL/>', () => {
  it('resolve ok', () => {
    expect(
      resolve(
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
      resolve(
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
    expect(() => resolve(<LABEL />)).toThrowErrorMatchingInlineSnapshot(
      `"prop \\"key\\" of <LABEL/> should not be empty"`
    );
    expect(() => resolve(<LABEL key="" />)).toThrowErrorMatchingInlineSnapshot(
      `"prop \\"key\\" of <LABEL/> should not be empty"`
    );
    expect(() =>
      resolve(<LABEL key={null} />)
    ).toThrowErrorMatchingInlineSnapshot(
      `"prop \\"key\\" of <LABEL/> should not be empty"`
    );
  });
});

describe('resolve <CALL/>', () => {
  it('resolve ok', () => {
    const getCallVars = () => ({ hi: 'yo' });
    const setFromVars = () => ({ foo: 'bar' });
    const segments = resolve(
      <>
        {() => 'hello'}
        <CALL
          script={AnotherScript}
          withVars={getCallVars}
          set={setFromVars}
          goto="foo"
          key="waiting"
        />
      </>
    );
    expect(segments).toEqual([
      { type: 'content', render: expect.any(Function) },
      {
        type: 'call',
        script: AnotherScript,
        withVars: getCallVars,
        setter: setFromVars,
        goto: 'foo',
        key: 'waiting',
      },
    ]);
    expect(segments[1].withVars({})).toEqual({ hi: 'yo' });
  });

  it('throw if non-script received', () => {
    expect(() =>
      resolve(
        <CALL key="call_another_script" script={{ something: 'wrong' }} />
      )
    ).toThrowErrorMatchingInlineSnapshot(
      `"invalid \\"script\\" prop received on <CALL/>"`
    );
  });

  it('throw if key is empty', () => {
    expect(() =>
      resolve(<CALL script={AnotherScript} />)
    ).toThrowErrorMatchingInlineSnapshot(
      `"prop \\"key\\" of <CALL/> should not be empty"`
    );
  });

  it('throw if goto key not existed', () => {
    expect(() =>
      resolve(
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

test('resolve <RETURN/>', () => {
  expect(
    resolve(
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
});

test('resolve whole script', () => {
  expect(
    resolve(
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
                setter={(vars, ctx) => ({ ...vars, a: ctx.a })}
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
                  setter={(vars, ctx) => ({ ...vars, c: ctx.c })}
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
              goto="bar"
            />
          </ELSE>
        </IF>

        <VARS set={vars => ({ ...vars, foo: 'bar' })} />
        <LABEL key="2nd" />
        {() => 'consectetur'}

        <VARS set={vars => ({ ...vars, foo: 'baz' })} />
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
                setter={(vars, ctx) => ({ ...vars, d: ctx.d })}
              />
            </THEN>
            <ELSE>
              <RETURN />
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
  expect(() => resolve('hello')).toThrowErrorMatchingInlineSnapshot(
    `"invalid script node: \\"hello\\""`
  );

  expect(() => resolve(<world />)).toThrowErrorMatchingInlineSnapshot(
    `"unexpected element: <world />"`
  );

  const Foo = () => {};
  expect(() => resolve(<Foo />)).toThrowErrorMatchingInlineSnapshot(
    `"unexpected element: <Foo />"`
  );

  expect(() => resolve(<THEN />)).toThrowErrorMatchingInlineSnapshot(
    `"unexpected keyword: <Symbol(machinat.script.keyword.then) />"`
  );
});
