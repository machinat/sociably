import compile from '../compile';

it('compile if segment ok', () => {
  const { commands, entryPointIndex } = compile(
    [
      {
        type: 'if',
        branches: [
          {
            condition: () => false,
            body: [
              { type: 'content', render: () => 'foo' },
              { type: 'prompt', key: 'ask1' },
            ],
          },
          {
            condition: () => true,
            body: [
              { type: 'content', render: () => 'bar' },
              { type: 'prompt', key: 'ask2' },
            ],
          },
        ],
        fallback: [
          { type: 'content', render: () => 'baz' },
          { type: 'prompt', key: 'ask3' },
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
    { type: 'content', render: expect.any(Function) },
    { type: 'prompt', key: 'ask3' },
    { type: 'jump', offset: 7 },
    { type: 'content', render: expect.any(Function) },
    { type: 'prompt', key: 'ask1' },
    { type: 'jump', offset: 4 },
    { type: 'content', render: expect.any(Function) },
    { type: 'prompt', key: 'ask2' },
    { type: 'jump', offset: 1 },
  ]);
  expect(commands[0].condition({})).toBe(false);
  expect(commands[1].condition({})).toBe(true);
  expect(commands[2].render({})).toBe('baz');
  expect(commands[5].render({})).toBe('foo');
  expect(commands[8].render({})).toBe('bar');

  expect(entryPointIndex).toEqual(
    new Map([
      ['ask1', 6],
      ['ask2', 9],
      ['ask3', 3],
    ])
  );
});

it('compile while segment ok', () => {
  const { commands, entryPointIndex } = compile(
    [
      {
        type: 'while',
        condition: () => true,
        body: [
          { type: 'content', render: ({ target }) => `hello ${target}` },
          { type: 'prompt', key: 'ask' },
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
    { type: 'content', render: expect.any(Function) },
    { type: 'prompt', key: 'ask' },
    { type: 'jump', offset: -3 },
  ]);
  expect(entryPointIndex).toEqual(new Map([['ask', 2]]));

  expect(commands[0].condition({})).toBe(true);
  expect(commands[1].render({ target: 'world' })).toBe('hello world');
});

it('compile other segments type ok', () => {
  const OrderScript = { fake: 'script' };

  const { commands, entryPointIndex } = compile(
    [
      { type: 'content', render: () => 'hello' },
      { type: 'label', key: 'begin' },
      { type: 'content', render: () => 'who r u' },
      {
        type: 'prompt',
        key: 'ask_something',
        setter: () => ({ name: 'Jojo' }),
      },
      { type: 'content', render: () => `hi Jojo, order ur meal` },
      {
        type: 'call',
        key: 'order_something',
        script: OrderScript,
        withVars: () => ({ foo: 'bar' }),
        setter: () => ({ drink: 'coffee' }),
        goto: 'ordering',
      },
      { type: 'set_vars', setter: () => ({ ordered: true }) },
      { type: 'label', key: 'end' },
      { type: 'content', render: () => 'enjoy ur meal' },
      { type: 'return' },
    ],
    { scriptName: 'MyScript' }
  );
  expect(commands).toEqual([
    { type: 'content', render: expect.any(Function) },
    { type: 'content', render: expect.any(Function) },
    {
      type: 'prompt',
      setter: expect.any(Function),
      key: 'ask_something',
    },
    { type: 'content', render: expect.any(Function) },
    {
      type: 'call',
      script: OrderScript,
      withVars: expect.any(Function),
      setter: expect.any(Function),
      key: 'order_something',
      goto: 'ordering',
    },
    { type: 'set_vars', setter: expect.any(Function) },
    { type: 'content', render: expect.any(Function) },
    { type: 'return' },
  ]);
  expect(entryPointIndex).toEqual(
    new Map([
      ['begin', 1],
      ['ask_something', 2],
      ['order_something', 4],
      ['end', 6],
    ])
  );
  expect(commands[0].render({})).toBe('hello');
  expect(commands[1].render({})).toBe('who r u');
  expect(commands[2].setter({})).toEqual({ name: 'Jojo' });
  expect(commands[3].render({})).toBe('hi Jojo, order ur meal');
  expect(commands[4].withVars({})).toEqual({ foo: 'bar' });
  expect(commands[5].setter({})).toEqual({ ordered: true });
  expect(commands[6].render({})).toBe('enjoy ur meal');
});

it('throw if key duplicated', () => {
  expect(() =>
    compile(
      [
        { type: 'content', render: () => 'Who R U?' },
        { type: 'prompt', key: 'who' },
        { type: 'content', render: () => 'Who R U exactly!?' },
        { type: 'prompt', key: 'who' },
      ],
      { scriptName: 'MyScript' }
    )
  ).toThrowErrorMatchingInlineSnapshot(
    `"key \\"who\\" duplicated in MyScript"`
  );
});
