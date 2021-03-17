import moxy from '@moxyjs/moxy';
import compile from '../compile';

describe('compile conditions segment', () => {
  test('with multi conditions', () => {
    const { commands, stopPointIndex }: any = compile(
      [
        {
          type: 'conditions',
          branches: [
            {
              condition: () => false,
              body: [
                { type: 'content', getContent: () => 'foo' },
                { type: 'prompt', key: 'ask1', setVars: undefined },
              ],
            },
            {
              condition: () => true,
              body: [
                { type: 'content', getContent: () => 'bar' },
                { type: 'prompt', key: 'ask2', setVars: undefined },
              ],
            },
          ],
          fallbackBody: null,
        },
      ],
      { scriptName: 'MyScript' }
    );
    expect(commands).toEqual([
      {
        type: 'jump_cond',
        condition: expect.any(Function),
        offset: 3,
        isNot: false,
      },
      {
        type: 'jump_cond',
        condition: expect.any(Function),
        offset: 5,
        isNot: false,
      },
      { type: 'jump', offset: 7 },
      { type: 'content', getContent: expect.any(Function) },
      { type: 'prompt', key: 'ask1' },
      { type: 'jump', offset: 4 },
      { type: 'content', getContent: expect.any(Function) },
      { type: 'prompt', key: 'ask2' },
      { type: 'jump', offset: 1 },
    ]);
    expect(commands[0].condition({})).toBe(false);
    expect(commands[1].condition({})).toBe(true);
    expect(commands[3].getContent({})).toBe('foo');
    expect(commands[6].getContent({})).toBe('bar');

    expect(stopPointIndex).toEqual(
      new Map([
        ['ask1', 4],
        ['ask2', 7],
      ])
    );
  });

  test('with multi conditions and fallback', () => {
    const { commands, stopPointIndex }: any = compile(
      [
        {
          type: 'conditions',
          branches: [
            {
              condition: () => false,
              body: [
                { type: 'content', getContent: () => 'foo' },
                { type: 'prompt', key: 'ask1', setVars: undefined },
              ],
            },
            {
              condition: () => true,
              body: [
                { type: 'content', getContent: () => 'bar' },
                { type: 'prompt', key: 'ask2', setVars: undefined },
              ],
            },
          ],
          fallbackBody: [
            { type: 'content', getContent: () => 'baz' },
            { type: 'prompt', key: 'ask3', setVars: undefined },
          ],
        },
      ],
      { scriptName: 'MyScript' }
    );
    expect(commands).toEqual([
      {
        type: 'jump_cond',
        condition: expect.any(Function),
        offset: 5,
        isNot: false,
      },
      {
        type: 'jump_cond',
        condition: expect.any(Function),
        offset: 7,
        isNot: false,
      },
      { type: 'content', getContent: expect.any(Function) },
      { type: 'prompt', key: 'ask3' },
      { type: 'jump', offset: 7 },
      { type: 'content', getContent: expect.any(Function) },
      { type: 'prompt', key: 'ask1' },
      { type: 'jump', offset: 4 },
      { type: 'content', getContent: expect.any(Function) },
      { type: 'prompt', key: 'ask2' },
      { type: 'jump', offset: 1 },
    ]);
    expect(commands[0].condition({})).toBe(false);
    expect(commands[1].condition({})).toBe(true);
    expect(commands[2].getContent({})).toBe('baz');
    expect(commands[5].getContent({})).toBe('foo');
    expect(commands[8].getContent({})).toBe('bar');

    expect(stopPointIndex).toEqual(
      new Map([
        ['ask1', 6],
        ['ask2', 9],
        ['ask3', 3],
      ])
    );
  });
});

it('compile while segment', () => {
  const { commands, stopPointIndex }: any = compile(
    [
      {
        type: 'while',
        condition: () => true,
        body: [
          {
            type: 'content',
            getContent: ({ vars: { target } }: any) => `hello ${target}`,
          },
          { type: 'prompt', key: 'ask', setVars: undefined },
        ],
      },
    ],
    { scriptName: 'MyScript' }
  );
  expect(commands).toEqual([
    {
      type: 'jump_cond',
      offset: 4,
      condition: expect.any(Function),
      isNot: true,
    },
    { type: 'content', getContent: expect.any(Function) },
    { type: 'prompt', key: 'ask' },
    { type: 'jump', offset: -3 },
  ]);
  expect(stopPointIndex).toEqual(new Map([['ask', 2]]));

  expect(commands[0].condition({})).toBe(true);
  expect(commands[1].getContent({ vars: { target: 'world' } })).toBe(
    'hello world'
  );
});

it('compile other segments type', () => {
  const OrderScript = { fake: 'script' } as never;
  const sideEffect = moxy();

  const { commands, stopPointIndex }: any = compile<unknown, unknown, unknown>(
    [
      { type: 'content', getContent: () => 'hello' },
      { type: 'label', key: 'begin' },
      { type: 'content', getContent: () => 'who r u' },
      {
        type: 'prompt',
        key: 'ask_something',
        setVars: () => ({ name: 'Jojo' }),
      },
      { type: 'content', getContent: () => `hi Jojo, order ur meal` },
      {
        type: 'call',
        key: 'order_something',
        script: OrderScript,
        withParams: () => ({ foo: 'bar' }),
        setVars: () => ({ drink: 'coffee' }),
        goto: 'ordering',
      },
      { type: 'vars', setVars: () => ({ ordered: true }) },
      { type: 'label', key: 'end' },
      { type: 'content', getContent: () => 'enjoy ur meal' },
      { type: 'effect', doEffect: () => sideEffect('done') },
      { type: 'return', getValue: () => 'foo' },
    ],
    { scriptName: 'MyScript' }
  );
  expect(commands).toEqual([
    { type: 'content', getContent: expect.any(Function) },
    { type: 'content', getContent: expect.any(Function) },
    {
      type: 'prompt',
      setVars: expect.any(Function),
      key: 'ask_something',
    },
    { type: 'content', getContent: expect.any(Function) },
    {
      type: 'call',
      script: OrderScript,
      withParams: expect.any(Function),
      setVars: expect.any(Function),
      key: 'order_something',
      goto: 'ordering',
    },
    { type: 'vars', setVars: expect.any(Function) },
    { type: 'content', getContent: expect.any(Function) },
    { type: 'effect', doEffect: expect.any(Function) },
    { type: 'return', getValue: expect.any(Function) },
  ]);
  expect(stopPointIndex).toEqual(
    new Map([
      ['begin', 1],
      ['ask_something', 2],
      ['order_something', 4],
      ['end', 6],
    ])
  );
  expect(commands[0].getContent({})).toBe('hello');
  expect(commands[1].getContent({})).toBe('who r u');
  expect(commands[2].setVars({})).toEqual({ name: 'Jojo' });
  expect(commands[3].getContent({})).toBe('hi Jojo, order ur meal');
  expect(commands[4].withParams({})).toEqual({ foo: 'bar' });
  expect(commands[5].setVars({})).toEqual({ ordered: true });
  expect(commands[6].getContent({})).toBe('enjoy ur meal');
  expect(commands[7].doEffect({})).toBe(undefined);
  expect(sideEffect.mock).toHaveReturnedTimes(1);
  expect(commands[8].getValue({})).toBe('foo');
});

it('throw if conditions key duplicated', () => {
  expect(() =>
    compile(
      [
        { type: 'content', getContent: () => 'Who R U?' },
        { type: 'prompt', key: 'who', setVars: undefined },
        { type: 'content', getContent: () => 'Who R U exactly!?' },
        { type: 'prompt', key: 'who', setVars: undefined },
      ],
      { scriptName: 'MyScript' }
    )
  ).toThrowErrorMatchingInlineSnapshot(
    `"key \\"who\\" duplicated in MyScript"`
  );
});
