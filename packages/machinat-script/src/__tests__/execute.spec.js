import moxy from 'moxy';
import execute from '../execute';

const mockScript = (commands, entryPointIndex, name) =>
  moxy(
    {
      name: name || 'MockScript',
      commands,
      entryPointIndex: entryPointIndex || new Map(),
    },
    { excludeProps: ['entryPointIndex'] }
  );

describe('behavior of commands', () => {
  test('run content command', () => {
    const contentCommand = {
      type: 'content',
      render: moxy(() => 'hello world'),
    };
    expect(
      execute([{ script: mockScript([contentCommand]), vars: { foo: 'bar' } }])
    ).toEqual({
      finished: true,
      finalVars: { foo: 'bar' },
      content: ['hello world'],
      stack: null,
    });
    expect(contentCommand.render.mock).toHaveBeenCalledTimes(1);
    expect(contentCommand.render.mock).toHaveBeenCalledWith({ foo: 'bar' });

    const contentCommand1 = { type: 'content', render: moxy(() => 'hello') };
    const contentCommand2 = { type: 'content', render: moxy(() => 'world') };
    expect(
      execute(
        [
          {
            script: mockScript([contentCommand1, contentCommand2]),
            vars: { foo: 'baz' },
          },
        ],
        false
      )
    ).toEqual({
      finished: true,
      finalVars: { foo: 'baz' },
      content: ['hello', 'world'],
      stack: null,
    });
    expect(contentCommand1.render.mock).toHaveBeenCalledTimes(1);
    expect(contentCommand1.render.mock).toHaveBeenCalledWith({ foo: 'baz' });
    expect(contentCommand2.render.mock).toHaveBeenCalledTimes(1);
    expect(contentCommand2.render.mock).toHaveBeenCalledWith({ foo: 'baz' });
  });

  test('run set_vars command', () => {
    const contentCommand = {
      type: 'content',
      render: moxy(({ t }) => `hi#${t}`),
    };
    const setVarsCommand = {
      type: 'set_vars',
      setter: moxy((vars) => ({ ...vars, t: vars.t + 1 })),
    };

    expect(
      execute(
        [
          {
            script: mockScript([
              contentCommand,
              setVarsCommand,
              contentCommand,
              setVarsCommand,
              contentCommand,
            ]),
            vars: { foo: 'bar', t: 0 },
          },
        ],
        false
      )
    ).toEqual({
      finished: true,
      finalVars: { foo: 'bar', t: 2 },
      content: ['hi#0', 'hi#1', 'hi#2'],
      stack: null,
    });
    expect(contentCommand.render.mock).toHaveBeenCalledTimes(3);
    expect(setVarsCommand.setter.mock).toHaveBeenCalledTimes(2);
    expect(setVarsCommand.setter.mock).toHaveBeenNthCalledWith(1, {
      foo: 'bar',
      t: 0,
    });
    expect(setVarsCommand.setter.mock).toHaveBeenNthCalledWith(2, {
      foo: 'bar',
      t: 1,
    });
  });

  test('return as unfinished if prompt command met', () => {
    const promptCommand = moxy({
      type: 'prompt',
      setter: () => ({}),
      key: 'prompt#0',
    });

    const script = mockScript([
      { type: 'content', render: () => 'foo' },
      promptCommand,
      { type: 'content', render: () => 'bar' },
    ]);

    expect(execute([{ script, vars: { foo: 'bar' } }], false)).toEqual({
      finished: false,
      finalVars: null,
      content: ['foo'],
      stack: [{ script, vars: { foo: 'bar' }, stoppedAt: 'prompt#0' }],
    });

    expect(promptCommand.setter.mock).not.toHaveBeenCalled();
  });

  test('continue from prompt', () => {
    const promptCommand = moxy({
      type: 'prompt',
      setter: (vars) => ({ ...vars, answer: 'no' }),
      key: 'prompt#0',
    });

    const script = mockScript(
      [
        { type: 'content', render: () => 'foo' },
        promptCommand,
        { type: 'content', render: () => 'bar' },
      ],
      new Map([['prompt#0', 1]])
    );

    expect(
      execute([{ script, vars: { foo: 'bar' }, stoppedAt: 'prompt#0' }], true, {
        event: 'hello again',
      })
    ).toEqual({
      finished: true,
      finalVars: { foo: 'bar', answer: 'no' },
      content: ['bar'],
      stack: null,
    });

    expect(promptCommand.setter.mock).toHaveBeenCalledTimes(1);
    expect(promptCommand.setter.mock).toHaveBeenCalledWith(
      { foo: 'bar' },
      { event: 'hello again' }
    );
  });

  test('run call command', () => {
    const subScript = {
      name: 'SubScript',
      commands: [{ type: 'content', render: moxy(() => 'at skyfall') }],
      entryPointIndex: new Map(),
    };
    const script = mockScript([
      { type: 'call', script: subScript },
      { type: 'content', render: () => 'aww~awwww~awwwwwwwwww~' },
    ]);

    expect(execute([{ script, vars: { foo: 'bar' } }], false)).toEqual({
      finished: true,
      finalVars: { foo: 'bar' },
      content: ['at skyfall', 'aww~awwww~awwwwwwwwww~'],
      stack: null,
    });
    expect(subScript.commands[0].render.mock).toHaveBeenCalledTimes(1);
    expect(subScript.commands[0].render.mock).toHaveBeenCalledWith({});
    expect(script.commands[1].render.mock).toHaveBeenCalledTimes(1);
    expect(script.commands[1].render.mock).toHaveBeenCalledWith({ foo: 'bar' });
  });

  test('run call command with vars and setter', () => {
    const subScript = {
      name: 'SubScript',
      commands: [
        { type: 'content', render: moxy(() => 'hello the other side') },
        { type: 'set_vars', setter: () => ({ hello: 'from bottom' }) },
      ],
      entryPointIndex: new Map(),
    };
    const script = mockScript([
      {
        type: 'call',
        script: subScript,
        withVars: () => ({ hello: 'from top' }),
        setter: (vars, subVars) => ({ ...vars, ...subVars }),
      },
      { type: 'content', render: () => 'yaaaaaay' },
    ]);

    expect(execute([{ script, vars: { foo: 'bar' } }], false)).toEqual({
      finished: true,
      finalVars: { foo: 'bar', hello: 'from bottom' },
      content: ['hello the other side', 'yaaaaaay'],
      stack: null,
    });
    expect(subScript.commands[0].render.mock).toHaveBeenCalledTimes(1);
    expect(subScript.commands[0].render.mock).toHaveBeenCalledWith({
      hello: 'from top',
    });
    expect(script.commands[0].withVars.mock).toHaveBeenCalledTimes(1);
    expect(script.commands[0].withVars.mock).toHaveBeenCalledWith({
      foo: 'bar',
    });
    expect(script.commands[0].setter.mock).toHaveBeenCalledTimes(1);
    expect(script.commands[0].setter.mock).toHaveBeenCalledWith(
      { foo: 'bar' },
      { hello: 'from bottom' }
    );
    expect(script.commands[1].render.mock).toHaveBeenCalledTimes(1);
    expect(script.commands[1].render.mock).toHaveBeenCalledWith({
      foo: 'bar',
      hello: 'from bottom',
    });
  });

  test('run call command if subscript unfinished', () => {
    const subScript = mockScript(
      [
        { type: 'content', render: () => "i can't go back" },
        { type: 'prompt', setter: () => ({}), key: 'childPrompt' },
      ],
      new Map(),
      'SubScript'
    );
    const script = mockScript([
      {
        type: 'call',
        script: subScript,
        withVars: () => ({ foo: 'baz' }),
        key: 'motherCall',
      },
      { type: 'content', render: () => 'to River Rea' },
    ]);

    expect(execute([{ script, vars: { foo: 'bar' } }], false)).toEqual({
      finished: false,
      finalVars: null,
      content: ["i can't go back"],
      stack: [
        { script, vars: { foo: 'bar' }, stoppedAt: 'motherCall' },
        { script: subScript, vars: { foo: 'baz' }, stoppedAt: 'childPrompt' },
      ],
    });
    expect(subScript.commands[0].render.mock).toHaveBeenCalledTimes(1);
    expect(subScript.commands[0].render.mock).toHaveBeenCalledWith({
      foo: 'baz',
    });
    expect(script.commands[1].render.mock).not.toHaveBeenCalled();
  });

  test('run call command with goto', () => {
    const subScript = {
      name: 'SubScript',
      commands: [
        { type: 'content', render: moxy(() => 'there is a fire') },
        { type: 'content', render: moxy(() => 'starting in my heart') },
      ],
      entryPointIndex: new Map([['where', 1]]),
    };

    expect(
      execute(
        [
          {
            script: mockScript([
              { type: 'call', script: subScript, goto: 'where' },
            ]),
            vars: { foo: 'bar' },
          },
        ],
        false
      )
    ).toEqual({
      finished: true,
      finalVars: { foo: 'bar' },
      content: ['starting in my heart'],
      stack: null,
    });
    expect(subScript.commands[0].render.mock).not.toHaveBeenCalled();
    expect(subScript.commands[1].render.mock).toHaveBeenCalledTimes(1);
    expect(subScript.commands[1].render.mock).toHaveBeenCalledWith({});
  });

  test('run jump command', () => {
    const script = mockScript([
      { type: 'content', render: () => 'foo' },
      { type: 'jump', offset: 2 },
      { type: 'content', render: () => 'bar' },
      { type: 'content', render: () => 'baz' },
    ]);
    expect(execute([{ script, vars: {} }], false)).toEqual({
      finished: true,
      finalVars: {},
      content: ['foo', 'baz'],
      stack: null,
    });
    expect(script.commands[2].render.mock).not.toHaveBeenCalled();
  });

  test('run jump command to overflow index', () => {
    const script = mockScript([
      { type: 'content', render: () => 'foo' },
      { type: 'jump', offset: 2 },
      { type: 'content', render: () => 'bar' },
    ]);
    expect(execute([{ script, vars: {} }], false)).toEqual({
      finished: true,
      finalVars: {},
      content: ['foo'],
      stack: null,
    });
    expect(script.commands[2].render.mock).not.toHaveBeenCalled();
  });

  test('run jump_cond command', () => {
    const script = mockScript([
      { type: 'content', render: () => 'foo' },
      {
        type: 'jump_cond',
        condition: () => true,
        isNot: false,
        offset: 2,
      },
      { type: 'content', render: () => 'bar' },
      { type: 'content', render: () => 'baz' },
    ]);
    expect(execute([{ script, vars: {} }], false)).toEqual({
      finished: true,
      finalVars: {},
      content: ['foo', 'baz'],
      stack: null,
    });
    expect(script.commands[2].render.mock).not.toHaveBeenCalled();

    script.commands[1].condition.mock.fakeReturnValue(false);
    expect(execute([{ script, vars: {} }], false)).toEqual({
      finished: true,
      finalVars: {},
      content: ['foo', 'bar', 'baz'],
      stack: null,
    });
    expect(script.commands[2].render.mock).toHaveBeenCalledTimes(1);
  });

  test('run jump_cond command with isNot set to true', () => {
    const script = mockScript([
      { type: 'content', render: () => 'foo' },
      { type: 'jump_cond', condition: () => true, isNot: true, offset: 2 },
      { type: 'content', render: () => 'bar' },
      { type: 'content', render: () => 'baz' },
    ]);
    expect(execute([{ script, vars: {} }], false)).toEqual({
      finished: true,
      finalVars: {},
      content: ['foo', 'bar', 'baz'],
      stack: null,
    });
    expect(script.commands[2].render.mock).toHaveBeenCalledTimes(1);

    script.commands[1].condition.mock.fakeReturnValue(false);
    expect(execute([{ script, vars: {} }], false)).toEqual({
      finished: true,
      finalVars: {},
      content: ['foo', 'baz'],
      stack: null,
    });
    expect(script.commands[2].render.mock).toHaveBeenCalledTimes(1);
  });

  test('return immediatly if return command met', () => {
    const script = mockScript([
      { type: 'content', render: () => 'hello' },
      { type: 'return' },
      { type: 'content', render: () => 'world' },
    ]);
    expect(execute([{ script, vars: { foo: 'bar' } }], false)).toEqual({
      finished: true,
      finalVars: { foo: 'bar' },
      content: ['hello'],
      stack: null,
    });
    expect(script.commands[2].render.mock).not.toHaveBeenCalled();
  });
});

describe('run whole script', () => {
  const SubScript = mockScript(
    [
      { type: 'content', render: ({ desc }) => desc },
      { type: 'jump_cond', condition: () => true, isNot: false, offset: 2 },
      {
        type: 'prompt',
        setter: (vars) => ({ ...vars, promptFromBottom: true }),
        key: 'CHILD_PROMPT',
      },
    ],
    new Map([
      ['BEGIN', 0],
      ['CHILD_PROMPT', 2],
    ]),
    'SubScript'
  );

  const MockScript = mockScript(
    [
      { type: 'jump_cond', condition: () => false, isNot: false, offset: 3 },
      { type: 'content', render: () => 'hello' },
      { type: 'jump', offset: 3 },
      { type: 'content', render: () => 'bye' },
      { type: 'return' },
      { type: 'jump_cond', condition: () => true, isNot: true, offset: 5 },
      {
        type: 'set_vars',
        setter: (vars) => ({ ...vars, t: (vars.t || 0) + 1 }),
      },
      {
        type: 'prompt',
        setter: (vars, { desc }) => ({ ...vars, desc }),
        key: 'PROMPT',
      },
      {
        type: 'call',
        script: SubScript,
        withVars: ({ desc }) => ({ desc }),
        setter: (vars, subVars) => ({ ...vars, ...subVars }),
        goto: 'BEGIN',
        key: 'CALL',
      },
      { type: 'jump', offset: -4 },
      { type: 'content', render: () => 'world' },
    ],
    new Map([
      ['BEGIN', 0],
      ['PROMPT', 7],
      ['CALL', 8],
    ]),
    'MockScript'
  );

  beforeEach(() => {
    MockScript.mock.reset();
    SubScript.mock.reset();
  });

  test('start from begin', () => {
    expect(
      execute([{ script: MockScript, vars: { foo: 'bar' } }], false)
    ).toEqual({
      finished: false,
      finalVars: null,
      stack: [
        {
          script: MockScript,
          vars: { foo: 'bar', t: 1 },
          stoppedAt: 'PROMPT',
        },
      ],
      content: ['hello'],
    });

    const { commands } = MockScript;
    expect(commands[0].condition.mock).toHaveBeenCalledTimes(1);
    expect(commands[1].render.mock).toHaveBeenCalledTimes(1);
    expect(commands[1].render.mock).toHaveBeenCalledWith({ foo: 'bar' });
    expect(commands[3].render.mock).not.toHaveBeenCalled();
    expect(commands[5].condition.mock).toHaveBeenCalledTimes(1);
    expect(commands[5].condition.mock).toHaveBeenCalledWith({ foo: 'bar' });
    expect(commands[6].setter.mock).toHaveBeenCalledTimes(1);
    expect(commands[6].setter.mock).toHaveBeenCalledWith({ foo: 'bar' });
    expect(commands[8].withVars.mock).not.toHaveBeenCalled();
    expect(commands[10].render.mock).not.toHaveBeenCalled();
  });

  test('return at middle', () => {
    MockScript.commands[0].condition.mock.fakeReturnValue(true);
    expect(
      execute([{ script: MockScript, vars: { foo: 'bar' } }], false)
    ).toEqual({
      finished: true,
      finalVars: { foo: 'bar' },
      stack: null,
      content: ['bye'],
    });

    const { commands } = MockScript;
    expect(commands[0].condition.mock).toHaveBeenCalledTimes(1);
    expect(commands[1].render.mock).not.toHaveBeenCalled();
    expect(commands[3].render.mock).toHaveBeenCalledTimes(1);
    expect(commands[3].render.mock).toHaveBeenCalledWith({ foo: 'bar' });
    expect(commands[5].condition.mock).not.toHaveBeenCalled();
    expect(commands[6].setter.mock).not.toHaveBeenCalled();
    expect(commands[8].withVars.mock).not.toHaveBeenCalled();
    expect(commands[10].render.mock).not.toHaveBeenCalled();
  });

  test('continue from prompt within the loops', () => {
    let stack = [
      { script: MockScript, vars: { foo: 'bar' }, stoppedAt: 'PROMPT' },
    ];

    const descriptions = ['fun', 'beautyful', 'wonderful'];
    for (const [idx, word] of descriptions.entries()) {
      const result = execute(stack, true, { desc: word });

      expect(result).toEqual({
        finished: false,
        finalVars: null,
        stack: [
          {
            script: MockScript,
            vars: { foo: 'bar', desc: word, t: idx + 1 },
            stoppedAt: 'PROMPT',
          },
        ],
        content: [word],
      });
      ({ stack } = result);
    }

    MockScript.commands[5].condition.mock.fakeReturnValue(false);
    expect(execute(stack, true, { desc: 'fascinating' })).toEqual({
      finished: true,
      finalVars: { foo: 'bar', t: 3, desc: 'fascinating' },
      stack: null,
      content: ['fascinating', 'world'],
    });

    const { commands } = MockScript;
    expect(commands[0].condition.mock).not.toHaveBeenCalled();
    expect(commands[1].render.mock).not.toHaveBeenCalled();
    expect(commands[3].render.mock).not.toHaveBeenCalled();
    expect(commands[5].condition.mock).toHaveBeenCalledTimes(4);
    expect(commands[6].setter.mock).toHaveBeenCalledTimes(3);
    expect(commands[8].withVars.mock).toHaveBeenCalledTimes(4);
    expect(commands[10].render.mock).toHaveBeenCalledTimes(1);

    expect(SubScript.commands[0].render.mock).toHaveBeenCalledTimes(4);
    expect(SubScript.commands[1].condition.mock).toHaveBeenCalledTimes(4);
  });

  test('prompt in the subscript', () => {
    SubScript.commands[1].condition.mock.fakeReturnValue(false);
    expect(
      execute(
        [{ script: MockScript, vars: { foo: 'bar' }, stoppedAt: 'PROMPT' }],
        true,
        { desc: 'fabulous' }
      )
    ).toEqual({
      finished: false,
      finalVars: null,
      stack: [
        {
          script: MockScript,
          vars: { foo: 'bar', desc: 'fabulous' },
          stoppedAt: 'CALL',
        },
        {
          script: SubScript,
          vars: { desc: 'fabulous' },
          stoppedAt: 'CHILD_PROMPT',
        },
      ],
      content: ['fabulous'],
    });

    const { commands } = MockScript;
    expect(commands[0].condition.mock).not.toHaveBeenCalled();
    expect(commands[1].render.mock).not.toHaveBeenCalled();
    expect(commands[3].render.mock).not.toHaveBeenCalled();
    expect(commands[5].condition.mock).not.toHaveBeenCalled();
    expect(commands[6].setter.mock).not.toHaveBeenCalled();
    expect(commands[8].withVars.mock).toHaveBeenCalledTimes(1);
    expect(commands[10].render.mock).not.toHaveBeenCalled();

    expect(SubScript.commands[0].render.mock).toHaveBeenCalledTimes(1);
    expect(SubScript.commands[0].render.mock).toHaveBeenCalledWith({
      desc: 'fabulous',
    });
    expect(SubScript.commands[1].condition.mock).toHaveBeenCalledTimes(1);
    expect(SubScript.commands[1].condition.mock).toHaveBeenCalledWith({
      desc: 'fabulous',
    });
  });

  test('start from sub script', () => {
    MockScript.commands[5].condition.mock.fakeReturnValue(false);
    expect(
      execute(
        [
          {
            script: MockScript,
            vars: { foo: 'bar' },
            stoppedAt: 'CALL',
          },
          {
            script: SubScript,
            vars: { foo: 'baz' },
            stoppedAt: 'CHILD_PROMPT',
          },
        ],
        true,
        { hello: 'subscript' }
      )
    ).toEqual({
      finished: true,
      finalVars: { foo: 'baz', promptFromBottom: true },
      stack: null,
      content: ['world'],
    });

    let { commands } = MockScript;
    expect(commands[0].condition.mock).not.toHaveBeenCalled();
    expect(commands[1].render.mock).not.toHaveBeenCalled();
    expect(commands[3].render.mock).not.toHaveBeenCalled();
    expect(commands[5].condition.mock).toHaveBeenCalledTimes(1);
    expect(commands[5].condition.mock).toHaveBeenCalledWith({
      foo: 'baz',
      promptFromBottom: true,
    });
    expect(commands[6].setter.mock).not.toHaveBeenCalled();
    expect(commands[8].withVars.mock).not.toHaveBeenCalled();
    expect(commands[8].setter.mock).toHaveBeenCalledTimes(1);
    expect(commands[8].setter.mock).toHaveBeenCalledWith(
      { foo: 'bar' },
      { foo: 'baz', promptFromBottom: true }
    );
    expect(commands[10].render.mock).toHaveBeenCalledTimes(1);
    expect(commands[10].render.mock).toHaveBeenCalledWith({
      foo: 'baz',
      promptFromBottom: true,
    });

    ({ commands } = SubScript);
    expect(commands[0].render.mock).not.toHaveBeenCalled();
    expect(commands[1].condition.mock).not.toHaveBeenCalled();
    expect(commands[2].setter.mock).toHaveBeenCalledTimes(1);
    expect(commands[2].setter.mock).toHaveBeenCalledWith(
      { foo: 'baz' },
      { hello: 'subscript' }
    );
  });
});

it('throw if stopped point key not found', () => {
  const script = mockScript(
    [{}, {}],
    new Map([
      ['foo', 0],
      ['bar', 1],
    ]),
    'MyScript'
  );
  expect(() =>
    execute([{ script, vars: {}, stoppedAt: 'UNKNOWN' }], {})
  ).toThrowErrorMatchingInlineSnapshot(
    `"key \\"UNKNOWN\\" not found in MyScript"`
  );
});

it('throw if stopped point is not <Prompt/>', () => {
  const script = mockScript(
    [
      { type: 'content', render: () => 'R U Cathy?' },
      { type: 'prompt', key: 'prompt#0' },
    ],
    new Map([
      ['ask', 0],
      ['prompt#0', 1],
    ]),
    'MyScript'
  );
  expect(() =>
    execute([{ script, vars: {}, stoppedAt: 'ask' }], {
      event: { text: 'yes' },
    })
  ).toThrowErrorMatchingInlineSnapshot(
    `"stopped point \\"ask\\" is not a <Prompt/>, the key mapping of MyScript might have been changed"`
  );
});

it('throw if returned point is not <Call/>', () => {
  const subScript = mockScript(
    [
      { type: 'content', render: () => 'how R U?' },
      { type: 'prompt', key: 'prompt#0' },
    ],
    new Map([
      ['ask', 0],
      ['prompt#0', 1],
    ]),
    'SubScript'
  );
  const script = mockScript(
    [
      { type: 'content', render: () => 'hi' },
      { type: 'call', script: subScript, key: 'call#0' },
    ],
    new Map([
      ['greet', 0],
      ['call#0', 1],
    ]),
    'MyScript'
  );
  expect(() =>
    execute(
      [
        { script, vars: {}, stoppedAt: 'greet' },
        { script: subScript, vars: {}, stoppedAt: 'prompt#0' },
      ],
      { event: { text: 'fine' } }
    )
  ).toThrowErrorMatchingInlineSnapshot(
    `"returned point \\"greet\\" is not a <Call/>, the key mapping of MyScript might have been changed"`
  );
});
