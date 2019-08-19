import Machinat from 'machinat';
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
import resolve from '../resolve';

const AnotherScript = {
  $$typeof: MACHINAT_SCRIPT_TYPE,
  Init: () => '(Init)',
  name: 'SomeQuestions',
  _executable: [
    { type: 'content', render: () => '...' },
    { type: 'prompt', key: 'ask' },
  ],
  _keyMapping: { foo: 3, bar: 8 },
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

describe('resolving <If/> segment', () => {
  it('resolve ok', () => {
    const segments = resolve(
      <If condition={() => true} key="an_if">
        <Then>{() => 'foo'}</Then>
      </If>
    );
    expect(segments).toEqual([
      {
        type: 'if',
        key: 'an_if',
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

  it('resolve ok with else', () => {
    const segments = resolve(
      <If condition={() => true} key="an_if">
        <Then>{() => 'foo'}</Then>
        <Else>{() => 'bar'}</Else>
      </If>
    );
    expect(segments).toEqual([
      {
        type: 'if',
        key: 'an_if',
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

  it('resolve ok with else if conditions', () => {
    const segments = resolve(
      <If condition={() => true}>
        <Then>{() => 'foo'}</Then>
        <ElseIf condition={() => false}>{() => 'bar'}</ElseIf>
        <ElseIf condition={() => true}>{() => 'baz'}</ElseIf>
        <Else>{() => 'boom boom pow'}</Else>
      </If>
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

  it('resolve ok nested', () => {
    expect(
      resolve(
        <If condition={() => true}>
          <Then>
            {() => 'foo'}
            <If condition={() => true}>
              <Then>{() => 'fooo'}</Then>
            </If>
            {() => 'foooo'}
          </Then>
          <ElseIf condition={() => true}>
            {() => 'bar'}
            <If condition={() => true}>
              <Then>{() => 'baar'}</Then>
              <ElseIf condition={() => true}>{() => 'baaar'}</ElseIf>
            </If>
            {() => 'baaaar'}
          </ElseIf>
          <Else>
            {() => 'baz'}
            <If condition={() => true}>
              <Then>{() => 'baaz'}</Then>
              <Else>{() => 'baaaz'}</Else>
            </If>
            {() => 'baaaaz'}
          </Else>
        </If>
      )
    ).toMatchSnapshot();
  });

  it('resolve ok if no children blocks', () => {
    expect(resolve(<If condition={() => true} key="foo"></If>)).toEqual([
      { type: 'if', key: 'foo', branches: [] },
    ]);
  });

  it('throw if condition is not a function', () => {
    expect(() => resolve(<If></If>)).toThrowErrorMatchingInlineSnapshot(
      `"prop \\"condition\\" of <If/> should be a function"`
    );
  });

  it('throw if non Then, ElseIf, Else block node contained', () => {
    expect(() =>
      resolve(<If condition={() => true}>hello</If>)
    ).toThrowErrorMatchingInlineSnapshot(
      `"only <[Then, ElseIf, Else]/> accepted within children of <If/>, got: \\"hello\\""`
    );
    expect(() =>
      resolve(
        <If condition={() => true}>
          <Prompt />
        </If>
      )
    ).toThrowErrorMatchingInlineSnapshot(
      `"only <[Then, ElseIf, Else]/> accepted within children of <If/>, got: <Symbol(machinat.script.keyword.prompt) />"`
    );
  });

  it('throw if multiple <Then/> received', () => {
    expect(() =>
      resolve(
        <If condition={() => true}>
          <Then>{() => 'bar'}</Then>
          <Then>{() => 'foo'}</Then>
        </If>
      )
    ).toThrowErrorMatchingInlineSnapshot(
      `"<Then /> should be the first block wihtin <If />"`
    );
  });

  it('throw if no <Then/> provided', () => {
    expect(() =>
      resolve(
        <If condition={() => true}>
          <Else>{() => 'baz'}</Else>
        </If>
      )
    ).toThrowErrorMatchingInlineSnapshot(`"no <Then/> block before <Else/>"`);
  });

  it('throw if multiple <Else/> received', () => {
    expect(() =>
      resolve(
        <If condition={() => true}>
          <Then>{() => 'foo'}</Then>
          <Else>{() => 'bar'}</Else>
          <Else>{() => 'baz'}</Else>
        </If>
      )
    ).toThrowErrorMatchingInlineSnapshot(
      `"multiple <Else/> block received in <If/>"`
    );
  });

  it('throw if <ElseIf/> not after <Then/> and before <Else/>', () => {
    expect(() =>
      resolve(
        <If condition={() => true}>
          <Then>{() => 'foo'}</Then>
          <Else>{() => 'baz'}</Else>
          <ElseIf condition={() => true}>{() => 'bar'}</ElseIf>
        </If>
      )
    ).toThrowErrorMatchingInlineSnapshot(
      `"<ElseIf /> should be placed between <Then /> and <Else /> blocks"`
    );
    expect(() =>
      resolve(
        <If condition={() => true}>
          <ElseIf condition={() => true}>{() => 'bar'}</ElseIf>
          <Then>{() => 'foo'}</Then>
          <Else>{() => 'baz'}</Else>
        </If>
      )
    ).toThrowErrorMatchingInlineSnapshot(
      `"<ElseIf /> should be placed between <Then /> and <Else /> blocks"`
    );
  });

  it('throw if condition of <ElseIf/> is not a function', () => {
    expect(() =>
      resolve(
        <If condition={() => true}>
          <Then>{() => 'foo'}</Then>
          <ElseIf>{() => 'bar'}</ElseIf>
        </If>
      )
    ).toThrowErrorMatchingInlineSnapshot(
      `"prop \\"condition\\" of <ElseIf/> should be a function"`
    );
  });
});

describe('resolving <For/> segment', () => {
  it('resolve ok', () => {
    const segments = resolve(
      <For var="name" of={() => ['world', 'fool', 'magician']} key="a_for">
        {({ name }) => `hello the ${name}`}
      </For>
    );
    expect(segments).toEqual([
      {
        type: 'for',
        key: 'a_for',
        varName: 'name',
        getIterable: expect.any(Function),
        body: [{ type: 'content', render: expect.any(Function) }],
      },
    ]);
    expect(segments[0].getIterable({})).toEqual(['world', 'fool', 'magician']);
    expect(segments[0].body[0].render({ name: 'strength' })).toBe(
      'hello the strength'
    );
  });

  it('resolve ok nested', () => {
    const segments = resolve(
      <For var="name" of={() => ['wands', 'swords', 'cups']} key="father_for">
        <For var="num" of={() => [1, 2, 3, 4, 5, 6]} key="child_for">
          {({ name, num }) => `${name} ${num}`}
        </For>
      </For>
    );
    expect(segments).toEqual([
      {
        type: 'for',
        key: 'father_for',
        varName: 'name',
        getIterable: expect.any(Function),
        body: [
          {
            type: 'for',
            key: 'child_for',
            varName: 'num',
            getIterable: expect.any(Function),
            body: [{ type: 'content', render: expect.any(Function) }],
          },
        ],
      },
    ]);
    expect(segments[0].getIterable({})).toEqual(['wands', 'swords', 'cups']);
    expect(segments[0].body[0].getIterable({})).toEqual([1, 2, 3, 4, 5, 6]);
    expect(segments[0].body[0].body[0].render({ name: 'coins', num: 5 })).toBe(
      'coins 5'
    );
  });

  it('throw if no iterable getter provided', () => {
    expect(() => resolve(<For />)).toThrowErrorMatchingInlineSnapshot(
      `"prop \\"of\\" of <For/> should be a function retruns iterable"`
    );
  });
});

describe('resolving <While/> segment', () => {
  it('resolve ok', () => {
    const segments = resolve(
      <While condition={() => true} key="a_while">
        {() => 'Gee'}
      </While>
    );
    expect(segments).toEqual([
      {
        type: 'while',
        key: 'a_while',
        condition: expect.any(Function),
        body: [{ type: 'content', render: expect.any(Function) }],
      },
    ]);
    expect(segments[0].condition({})).toBe(true);
    expect(segments[0].body[0].render({})).toBe('Gee');
  });

  it('resolve ok nested', () => {
    const segments = resolve(
      <While condition={() => true} key="father_while">
        <While condition={() => false} key="child_while">
          {() => 'Goo'}
        </While>
      </While>
    );
    expect(segments).toEqual([
      {
        type: 'while',
        key: 'father_while',
        condition: expect.any(Function),
        body: [
          {
            type: 'while',
            key: 'child_while',
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
      resolve(<While condition="true">{() => 'foo'}</While>)
    ).toThrowErrorMatchingInlineSnapshot(
      `"prop \\"condition\\" of <While/> should be a function"`
    );
  });
});

describe('resolving <Vars/> segment', () => {
  it('resolve ok', () => {
    const helloSetter = () => ({ hello: 'world' });
    const greetedSetter = () => ({ greeted: true });
    expect(
      resolve(
        <>
          <Vars set={helloSetter} />
          {vars => `hello ${vars.hello}`}
          <Vars set={greetedSetter} />
        </>
      )
    ).toEqual([
      { type: 'set_vars', setter: helloSetter },
      { type: 'content', render: expect.any(Function) },
      { type: 'set_vars', setter: greetedSetter },
    ]);
  });

  it('throw if set is empty', () => {
    expect(() => resolve(<Vars />)).toThrowErrorMatchingInlineSnapshot(`""`);
    expect(() =>
      resolve(<Vars set={null} />)
    ).toThrowErrorMatchingInlineSnapshot(`""`);
  });
});

describe('resolving <Prompt/> segment', () => {
  it('resolve ok', () => {
    const answerSetter = (_, { event: { text } }) => ({ answer: text });
    expect(
      resolve(
        <>
          {() => 'but why!?'}
          <Prompt set={answerSetter} key="why" />
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
          <Prompt set={answerSetter} key="where" />
          {() => 'what r u doing?'}
          <Prompt set={answerSetter} key="what" />
        </>
      )
    ).toEqual([
      { type: 'content', render: expect.any(Function) },
      { type: 'prompt', key: 'where', setter: answerSetter },
      { type: 'content', render: expect.any(Function) },
      { type: 'prompt', key: 'what', setter: answerSetter },
    ]);
  });

  it('add default key if not provided', () => {
    const answerSetter = (_, { event: { text } }) => ({ answer: text });
    expect(resolve(<Prompt set={answerSetter} />)).toEqual([
      { type: 'prompt', setter: answerSetter, key: 'prompt#0' },
    ]);

    expect(
      resolve(
        <>
          <Prompt set={answerSetter} />
          <Prompt set={answerSetter} key="foo" />
          <Prompt set={answerSetter} />
        </>
      )
    ).toEqual([
      { type: 'prompt', key: 'prompt#0', setter: answerSetter },
      { type: 'prompt', key: 'foo', setter: answerSetter },
      { type: 'prompt', key: 'prompt#2', setter: answerSetter },
    ]);
  });
});

describe('resolving <Label/> segment', () => {
  it('resolve ok', () => {
    expect(
      resolve(
        <>
          <Label key="foo" />
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
          <Label key="bar" />
          {() => 'bar'}
          <Label key="baz" />
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
    expect(() => resolve(<Label />)).toThrowErrorMatchingInlineSnapshot(
      `"prop \\"key\\" of <Label/> should not be empty"`
    );
    expect(() => resolve(<Label key="" />)).toThrowErrorMatchingInlineSnapshot(
      `"prop \\"key\\" of <Label/> should not be empty"`
    );
    expect(() =>
      resolve(<Label key={null} />)
    ).toThrowErrorMatchingInlineSnapshot(
      `"prop \\"key\\" of <Label/> should not be empty"`
    );
  });
});

describe('resolving <Call/> segments', () => {
  it('resolve ok', () => {
    const segments = resolve(
      <>
        {() => 'hello'}
        <Call
          script={AnotherScript}
          withVars={() => ({ foo: 'bar' })}
          goto="greet"
          key="waiting"
        />
      </>
    );
    expect(segments).toEqual([
      { type: 'content', render: expect.any(Function) },
      {
        type: 'call',
        script: AnotherScript,
        withVars: expect.any(Function),
        gotoKey: 'greet',
        key: 'waiting',
      },
    ]);
    expect(segments[1].withVars({})).toEqual({ foo: 'bar' });
  });

  it('throw if non-script received', () => {
    expect(() =>
      resolve(<Call script={{ something: 'wrong' }} />)
    ).toThrowErrorMatchingInlineSnapshot(
      `"invalid \\"script\\" prop received on <Call/>"`
    );
  });
});

test('resolve whole script', () => {
  expect(
    resolve(
      <>
        <Label key="start" />
        {() => <b>Lorem</b>}

        <If condition={() => false} key="first">
          <Then>
            <While condition={() => true}>
              {() => <i>ipsum</i>}
              <Prompt setter={(vars, frm) => ({ ...vars, a: frm.a })} />
            </While>
          </Then>
          <ElseIf condition={() => true}>
            <For var="n" of={() => [1, 2, 3]}>
              {() => <dolor />}
              <Prompt setter={(vars, frm) => ({ ...vars, b: frm.b })} />
            </For>
          </ElseIf>
          <Else>
            {() => 'sit amet,'}
            <Call
              script={AnotherScript}
              withVars={() => ({ foo: 'bar' })}
              goto="xxx"
            />
          </Else>
        </If>

        <Vars set={vars => ({ ...vars, foo: 'bar' })} />
        <Label key="second" />
        {() => 'consectetur'}

        <For var="x" of={() => ['adipiscing', 'elit']}>
          {() => 'sed do'}
          <If condition={() => false}>
            <Then>
              {() => <eiusmod />}
              <Prompt setter={(vars, frm) => ({ ...vars, c: frm.c })} />
            </Then>
            <Else>{() => 'tempor'}</Else>
          </If>

          <While condition={() => true}>
            <Label key="three" />
            {() => <magna />}
          </While>
        </For>

        <Vars set={vars => ({ ...vars, foo: 'baz' })} />
        <Label key="four" />
        {() => <del>incididunt</del>}

        <While condition={() => false}>
          {() => 'ut labore et'}
          <If condition={() => false}>
            <Then>
              {() => <dolore />}
              <Prompt setter={(vars, frm) => ({ ...vars, d: frm.d })} />
            </Then>
            <Else>
              <For var="y" of={() => ['ex', 'ea']}>
                {() => 'aliqua'}
              </For>
            </Else>
          </If>
        </While>

        {() => <a>Ut enim</a>}
        <Call
          script={AnotherScript}
          withVars={() => ({ foo: 'baz' })}
          goto="zzz"
        />

        <Label key="end" />
        <Prompt set={() => ({ end: true })} />
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

  expect(() => resolve(<Then />)).toThrowErrorMatchingInlineSnapshot(
    `"unexpected keyword: <Symbol(machinat.script.keyword.then) />"`
  );
});
