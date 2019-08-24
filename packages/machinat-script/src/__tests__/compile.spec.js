import compile from '../compile';

it('compile if segment ok', () => {
  const { commands, keyMapping } = compile(
    [
      {
        type: 'if',
        key: 'a_if',
        branches: [
          {
            condition: () => false,
            body: [
              { type: 'content', render: () => 'foo' },
              { type: 'prompt', key: 'ask1', setter: () => ({ a: 0 }) },
            ],
          },
          {
            condition: () => true,
            body: [
              { type: 'content', render: () => 'bar' },
              { type: 'prompt', key: 'ask2', setter: () => ({ b: 1 }) },
            ],
          },
        ],
        fallback: [
          { type: 'content', render: () => 'baz' },
          { type: 'prompt', key: 'ask3', setter: () => ({ c: 2 }) },
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
    { type: 'prompt', setter: expect.any(Function), key: 'ask3' },
    { type: 'jump', offset: 7 },
    { type: 'content', render: expect.any(Function) },
    { type: 'prompt', setter: expect.any(Function), key: 'ask1' },
    { type: 'jump', offset: 4 },
    { type: 'content', render: expect.any(Function) },
    { type: 'prompt', setter: expect.any(Function), key: 'ask2' },
    { type: 'jump', offset: 1 },
  ]);
  expect(commands[0].condition({})).toBe(false);
  expect(commands[1].condition({})).toBe(true);
  expect(commands[2].render({})).toBe('baz');
  expect(commands[3].setter({})).toEqual({ c: 2 });
  expect(commands[5].render({})).toBe('foo');
  expect(commands[6].setter({})).toEqual({ a: 0 });
  expect(commands[8].render({})).toBe('bar');
  expect(commands[9].setter({})).toEqual({ b: 1 });
  expect(keyMapping).toEqual(
    new Map([['a_if', 0], ['ask1', 6], ['ask2', 9], ['ask3', 3]])
  );
});

it('compile while segment ok', () => {
  const { commands, keyMapping } = compile(
    [
      {
        type: 'while',
        key: 'a_while',
        condition: () => true,
        body: [
          { type: 'content', render: ({ target }) => `hello ${target}` },
          {
            type: 'prompt',
            key: 'ask',
            setter: (_, frm) => ({ words: frm.event.text }),
          },
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
    { type: 'prompt', setter: expect.any(Function), key: 'ask' },
    { type: 'jump', offset: -3 },
  ]);
  expect(keyMapping).toEqual(new Map([['a_while', 0], ['ask', 2]]));

  expect(commands[0].condition({})).toBe(true);
  expect(commands[1].render({ target: 'world' })).toBe('hello world');
  expect(commands[2].setter({}, { event: { text: 'baz' } })).toEqual({
    words: 'baz',
  });
});

it('compile for segment ok', () => {
  const getIterable = vars => [...vars.foo];
  const { commands, keyMapping } = compile(
    [
      {
        type: 'for',
        key: 'a_for',
        varName: 'x',
        getIterable,
        body: [
          { type: 'content', render: ({ foo }) => `hello ${foo}` },
          {
            type: 'prompt',
            key: 'ask',
            setter: (_, frm) => ({ words: frm.event.text }),
          },
        ],
      },
    ],
    { scriptName: 'MyScript' }
  );
  expect(commands).toEqual([
    {
      type: 'iter_outset',
      iterName: 'for_0',
      getIterable,
      varName: 'x',
      endingOffset: 4,
    },
    { type: 'content', render: expect.any(Function) },
    { type: 'prompt', setter: expect.any(Function), key: 'ask' },
    { type: 'jump', offset: -3 },
  ]);
  expect(keyMapping).toEqual(new Map([['a_for', 0], ['ask', 2]]));

  const vars = { foo: 'bar' };
  expect(commands[0].getIterable(vars)).toEqual(['b', 'a', 'r']);
  expect(commands[1].render(vars)).toBe('hello bar');
  expect(commands[2].setter(vars, { event: { text: 'yo' } })).toEqual({
    words: 'yo',
  });
});

it('compile other segments type ok', () => {
  const OrderScript = { fake: 'script' };

  const { commands, keyMapping } = compile(
    [
      { type: 'content', render: () => 'hello' },
      { type: 'label', key: 'begin' },
      { type: 'content', render: () => 'who r u' },
      { type: 'prompt', setter: (_, { event }) => ({ name: event.text }) },
      { type: 'content', render: ({ name }) => `hi ${name}, order ur meal` },
      {
        type: 'call',
        script: OrderScript,
        withVars: () => ({ foo: 'bar' }),
        gotoKey: 'ordering',
      },
      { type: 'set_vars', setter: () => ({ ordered: true }) },
      { type: 'label', key: 'end' },
      { type: 'content', render: () => 'enjoy ur meal' },
    ],
    { scriptName: 'MyScript' }
  );
  expect(commands).toEqual([
    { type: 'content', render: expect.any(Function) },
    { type: 'content', render: expect.any(Function) },
    { type: 'prompt', setter: expect.any(Function) },
    { type: 'content', render: expect.any(Function) },
    {
      type: 'call',
      script: OrderScript,
      withVars: expect.any(Function),
      gotoKey: 'ordering',
    },
    { type: 'set_vars', setter: expect.any(Function) },
    { type: 'content', render: expect.any(Function) },
  ]);
  expect(keyMapping).toEqual(new Map([['begin', 1], ['end', 6]]));
  expect(commands[0].render({})).toBe('hello');
  expect(commands[1].render({})).toBe('who r u');
  expect(commands[2].setter({}, { event: { text: 'Joe' } })).toEqual({
    name: 'Joe',
  });
  expect(commands[3].render({ name: 'Joe' })).toBe('hi Joe, order ur meal');
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
