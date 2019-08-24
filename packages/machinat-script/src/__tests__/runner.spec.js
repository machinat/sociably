import moxy from 'moxy';
import runner from '../runner';

const mockScript = (commands, keyMapping, name) =>
  moxy(
    {
      name: name || 'MockScript',
      _commands: commands,
      _keyMapping: keyMapping || new Map(),
    },
    { excludeProps: ['_keyMapping'] }
  );

describe('behavior of commands', () => {
  const testRunning = (script, vars) =>
    runner([{ script, vars, at: undefined }]);

  const contentCommand = {
    type: 'content',
    render: moxy(({ t }) => `hi#${t}`),
  };

  const setVarsCommand = {
    type: 'set_vars',
    setter: moxy(({ t }) => ({ t: t + 1 })),
  };

  beforeEach(() => {
    contentCommand.render.mock.reset();
    setVarsCommand.setter.mock.reset();
  });

  test('run content command', () => {
    contentCommand.render.mock.fakeReturnValueOnce('hello world');
    expect(testRunning(mockScript([contentCommand]), { foo: 'bar' })).toEqual({
      finished: true,
      content: ['hello world'],
      stack: undefined,
    });
    expect(contentCommand.render.mock).toHaveBeenCalledTimes(1);
    expect(contentCommand.render.mock).toHaveBeenCalledWith({ foo: 'bar' });

    // multiple content commands
    contentCommand.render.mock.fakeReturnValueOnce('hello');
    contentCommand.render.mock.fakeReturnValueOnce('world');
    expect(
      testRunning(mockScript([contentCommand, contentCommand]), { foo: 'bar' })
    ).toEqual({
      finished: true,
      content: ['hello', 'world'],
      stack: undefined,
    });
    expect(contentCommand.render.mock).toHaveBeenCalledTimes(3);
  });

  test('run set_vars command', () => {
    expect(
      testRunning(
        mockScript([
          contentCommand,
          setVarsCommand,
          contentCommand,
          setVarsCommand,
          contentCommand,
        ]),
        { foo: 'bar', t: 0 }
      )
    ).toEqual({
      finished: true,
      content: ['hi#0', 'hi#1', 'hi#2'],
      stack: undefined,
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

  test('run prompt command', () => {
    const promptCommand = moxy({
      type: 'prompt',
      setter: () => ({}),
      key: 'prompt#0',
    });
    const script = mockScript([
      contentCommand,
      setVarsCommand,
      promptCommand,
      contentCommand,
    ]);
    expect(testRunning(script, { foo: 'bar', t: 0 })).toEqual({
      finished: false,
      content: ['hi#0'],
      stack: [{ script, vars: { foo: 'bar', t: 1 }, at: 'prompt#0' }],
    });
    expect(contentCommand.render.mock).toHaveBeenCalledTimes(1);
    expect(setVarsCommand.setter.mock).toHaveBeenCalledTimes(1);
    expect(promptCommand.setter.mock).not.toHaveBeenCalled();
  });

  test('run call command if sub-script finished', () => {
    const subScript = {
      name: 'SubScript',
      _commands: [
        { type: 'content', render: moxy(() => 'hello the other side') },
      ],
      _keyMapping: new Map(),
    };
    const script = mockScript([
      { type: 'call', script: subScript },
      { type: 'content', render: () => 'yaaaaaay' },
    ]);

    expect(testRunning(script, { foo: 'bar' })).toEqual({
      finished: true,
      content: ['hello the other side', 'yaaaaaay'],
      stack: undefined,
    });
    expect(subScript._commands[0].render.mock).toHaveBeenCalledTimes(1);
    expect(subScript._commands[0].render.mock).toHaveBeenCalledWith({});
    expect(script._commands[1].render.mock).toHaveBeenCalledTimes(1);
    expect(script._commands[1].render.mock).toHaveBeenCalledWith({
      foo: 'bar',
    });
  });

  test('run call command with withVars', () => {
    const subScript = {
      name: 'SubScript',
      _commands: [{ type: 'content', render: moxy(() => 'at skyfall') }],
      _keyMapping: new Map(),
    };
    const script = mockScript([
      {
        type: 'call',
        script: subScript,
        withVars: () => ({ foo: 'baz' }),
      },
      { type: 'content', render: () => 'awwww awwww awwwwwwwwww' },
    ]);

    expect(testRunning(script, { foo: 'bar' })).toEqual({
      finished: true,
      content: ['at skyfall', 'awwww awwww awwwwwwwwww'],
      stack: undefined,
    });
    expect(subScript._commands[0].render.mock).toHaveBeenCalledTimes(1);
    expect(subScript._commands[0].render.mock).toHaveBeenCalledWith({
      foo: 'baz',
    });
    expect(script._commands[0].withVars.mock).toHaveBeenCalledTimes(1);
    expect(script._commands[0].withVars.mock).toHaveBeenCalledWith({
      foo: 'bar',
    });
    expect(script._commands[1].render.mock).toHaveBeenCalledTimes(1);
    expect(script._commands[1].render.mock).toHaveBeenCalledWith({
      foo: 'bar',
    });
  });

  test('run call command if sub-script not finished', () => {
    const subScript = moxy({
      name: 'SubScript',
      _commands: [
        { type: 'content', render: () => "i can't go back" },
        { type: 'prompt', setter: () => ({}), key: 'childPrompt' },
      ],
      _keyMapping: new Map(),
    });
    const script = mockScript([
      {
        type: 'call',
        script: subScript,
        withVars: () => ({ foo: 'baz' }),
        key: 'motherCall',
      },
      { type: 'content', render: () => 'to River Rea' },
    ]);

    expect(testRunning(script, { foo: 'bar' })).toEqual({
      finished: false,
      content: ["i can't go back"],
      stack: [
        { script, vars: { foo: 'bar' }, at: 'motherCall' },
        { script: subScript, vars: { foo: 'baz' }, at: 'childPrompt' },
      ],
    });
    expect(subScript._commands[0].render.mock).toHaveBeenCalledTimes(1);
    expect(subScript._commands[0].render.mock).toHaveBeenCalledWith({
      foo: 'baz',
    });
    expect(script._commands[1].render.mock).not.toHaveBeenCalled();
  });

  test('run call command with gotoKey', () => {
    const subScript = {
      name: 'SubScript',
      _commands: [
        { type: 'content', render: moxy(() => 'there is a fire') },
        { type: 'content', render: moxy(() => 'starting in my heart') },
      ],
      _keyMapping: new Map([['where_is_it', 1]]),
    };

    expect(
      testRunning(
        mockScript([
          { type: 'call', script: subScript, gotoKey: 'where_is_it' },
        ]),
        {}
      )
    ).toEqual({
      finished: true,
      content: ['starting in my heart'],
      stack: undefined,
    });
    expect(subScript._commands[0].render.mock).not.toHaveBeenCalled();
    expect(subScript._commands[1].render.mock).toHaveBeenCalledTimes(1);
    expect(subScript._commands[1].render.mock).toHaveBeenCalledWith({});
  });

  test('run jump command', () => {
    const script = mockScript([
      { type: 'content', render: () => 'foo' },
      { type: 'jump', index: 3 },
      { type: 'content', render: () => 'bar' },
      { type: 'content', render: () => 'baz' },
    ]);
    expect(testRunning(script, {})).toEqual({
      finished: true,
      content: ['foo', 'baz'],
      stack: undefined,
    });
    expect(script._commands[2].render.mock).not.toHaveBeenCalled();
  });

  test('run jump command to overflow index', () => {
    const script = mockScript([
      { type: 'content', render: () => 'foo' },
      { type: 'jump', index: 3 },
      { type: 'content', render: () => 'bar' },
    ]);
    expect(testRunning(script, {})).toEqual({
      finished: true,
      content: ['foo'],
      stack: undefined,
    });
    expect(script._commands[2].render.mock).not.toHaveBeenCalled();
  });

  test('run jump_cond command', () => {
    const script = mockScript([
      { type: 'content', render: () => 'foo' },
      {
        type: 'jump_cond',
        condition: () => true,
        isNot: false,
        index: 3,
      },
      { type: 'content', render: () => 'bar' },
      { type: 'content', render: () => 'baz' },
    ]);
    expect(testRunning(script, {})).toEqual({
      finished: true,
      content: ['foo', 'baz'],
      stack: undefined,
    });
    expect(script._commands[2].render.mock).not.toHaveBeenCalled();

    script._commands[1].condition.mock.fakeReturnValue(false);
    expect(testRunning(script, {})).toEqual({
      finished: true,
      content: ['foo', 'bar', 'baz'],
      stack: undefined,
    });
    expect(script._commands[2].render.mock).toHaveBeenCalledTimes(1);
  });

  test('run jump_cond command with isNot set to true', () => {
    const script = mockScript([
      { type: 'content', render: () => 'foo' },
      { type: 'jump_cond', condition: () => true, isNot: true, index: 3 },
      { type: 'content', render: () => 'bar' },
      { type: 'content', render: () => 'baz' },
    ]);
    expect(testRunning(script, {})).toEqual({
      finished: true,
      content: ['foo', 'bar', 'baz'],
      stack: undefined,
    });
    expect(script._commands[2].render.mock).toHaveBeenCalledTimes(1);

    script._commands[1].condition.mock.fakeReturnValue(false);
    expect(testRunning(script, {})).toEqual({
      finished: true,
      content: ['foo', 'baz'],
      stack: undefined,
    });
    expect(script._commands[2].render.mock).toHaveBeenCalledTimes(1);
  });
});

describe('running whole script', () => {
  const SubScript = mockScript(
    [
      { type: 'content', render: () => 'hello' },
      { type: 'jump_cond', condition: () => true, isNot: false, index: 3 },
      { type: 'prompt', setter: () => ({}), key: 'CHILD_PROMPT' },
    ],
    new Map([['BEGIN', 0], ['CHILD_PROMPT', 2]]),
    'SubScript'
  );

  const MockScript = mockScript(
    [
      {
        type: 'content',
        render: ({ descs }) => (descs ? descs.join(', ') : 'empty'),
      },
      { type: 'set_vars', setter: ({ t }) => ({ t: (t || 0) + 1 }) },
      { type: 'jump_cond', condition: () => true, isNot: true, index: 6 },
      {
        type: 'prompt',
        setter: ({ descs }, { event: { text } }) => ({
          descs: descs ? [...descs, text] : [text],
        }),
        key: 'PROMPT',
      },
      {
        type: 'call',
        script: SubScript,
        withVars: vars => ({ ...vars, foo: 'baz' }),
        gotoKey: 'BEGIN',
        key: 'CALL',
      },
      { type: 'jump', index: 0 },
      { type: 'content', render: () => 'world' },
    ],
    new Map([['BEGIN', 0], ['PROMPT', 3], ['CALL', 4]]),
    'MockScript'
  );

  beforeEach(() => {
    MockScript.mock.reset();
    SubScript.mock.reset();
  });

  test('start from begin', () => {
    expect(
      runner([{ script: MockScript, vars: { foo: 'bar' }, at: 'BEGIN' }])
    ).toEqual({
      finished: false,
      stack: [
        {
          script: MockScript,
          vars: { foo: 'bar', t: 1 },
          at: 'PROMPT',
        },
      ],
      content: ['empty'],
    });

    const commands = MockScript._commands;
    expect(commands[0].render.mock).toHaveBeenCalledTimes(1);
    expect(commands[0].render.mock).toHaveBeenCalledWith({ foo: 'bar' });
    expect(commands[1].setter.mock).toHaveBeenCalledTimes(1);
    expect(commands[1].setter.mock).toHaveBeenCalledWith({ foo: 'bar' });
    expect(commands[2].condition.mock).toHaveBeenCalledTimes(1);
    expect(commands[2].condition.mock).toHaveBeenCalledWith({
      foo: 'bar',
      t: 1,
    });
    expect(commands[4].withVars.mock).not.toHaveBeenCalled();
    expect(commands[6].render.mock).not.toHaveBeenCalled();
  });

  test('jump to the end', () => {
    MockScript._commands[2].condition.mock.fakeReturnValue(false);
    expect(
      runner([{ script: MockScript, vars: { foo: 'bar' }, at: 'BEGIN' }])
    ).toEqual({
      finished: true,
      stack: undefined,
      content: ['empty', 'world'],
    });

    const commands = MockScript._commands;
    expect(commands[0].render.mock).toHaveBeenCalledTimes(1);
    expect(commands[1].setter.mock).toHaveBeenCalledTimes(1);
    expect(commands[2].condition.mock).toHaveBeenCalledTimes(1);
    expect(commands[4].withVars.mock).not.toHaveBeenCalled();
    expect(commands[6].render.mock).toHaveBeenCalledTimes(1);
    expect(commands[6].render.mock).toHaveBeenCalledWith({ foo: 'bar', t: 1 });
  });

  test('prompt in the loops', () => {
    let stack = [{ script: MockScript, vars: { foo: 'bar' }, at: 'PROMPT' }];

    const descs = ['fun', 'beautyful', 'wonderful'];
    for (const [idx, word] of descs.entries()) {
      const result = runner(stack, { event: { text: word } });
      expect(result).toEqual({
        finished: false,
        stack: [
          {
            script: MockScript,
            vars: { foo: 'bar', t: idx + 1, descs: descs.slice(0, idx + 1) },
            at: 'PROMPT',
          },
        ],
        content: ['hello', descs.slice(0, idx + 1).join(', ')],
      });
      ({ stack } = result);
    }

    MockScript._commands[2].condition.mock.fakeReturnValue(false);
    expect(runner(stack, { event: { text: 'fascinating' } })).toEqual({
      finished: true,
      stack: undefined,
      content: ['hello', 'fun, beautyful, wonderful, fascinating', 'world'],
    });

    expect(MockScript._commands[0].render.mock).toHaveBeenCalledTimes(4);
    expect(MockScript._commands[1].setter.mock).toHaveBeenCalledTimes(4);
    expect(MockScript._commands[2].condition.mock).toHaveBeenCalledTimes(4);
    expect(MockScript._commands[3].setter.mock).toHaveBeenCalledTimes(4);
    expect(MockScript._commands[4].withVars.mock).toHaveBeenCalledTimes(4);
    expect(MockScript._commands[6].render.mock).toHaveBeenCalledTimes(1);

    expect(SubScript._commands[0].render.mock).toHaveBeenCalledTimes(4);
    expect(SubScript._commands[1].condition.mock).toHaveBeenCalledTimes(4);
  });

  test('stopped at sub script', () => {
    SubScript._commands[1].condition.mock.fakeReturnValue(false);
    expect(
      runner([{ script: MockScript, vars: { foo: 'bar' }, at: 'PROMPT' }], {
        event: { text: 'fabulous' },
      })
    ).toEqual({
      finished: false,
      stack: [
        {
          script: MockScript,
          vars: { foo: 'bar', descs: ['fabulous'] },
          at: 'CALL',
        },
        {
          script: SubScript,
          vars: { foo: 'baz', descs: ['fabulous'] },
          at: 'CHILD_PROMPT',
        },
      ],
      content: ['hello'],
    });
    expect(MockScript._commands[0].render.mock).not.toHaveBeenCalled();
    expect(MockScript._commands[1].setter.mock).not.toHaveBeenCalled();
    expect(MockScript._commands[2].condition.mock).not.toHaveBeenCalled();
    expect(MockScript._commands[3].setter.mock).toHaveBeenCalledTimes(1);
    expect(MockScript._commands[4].withVars.mock).toHaveBeenCalledTimes(1);
    expect(MockScript._commands[6].render.mock).not.toHaveBeenCalled();

    expect(SubScript._commands[0].render.mock).toHaveBeenCalledTimes(1);
    expect(SubScript._commands[0].render.mock).toHaveBeenCalledWith({
      foo: 'baz',
      descs: ['fabulous'],
    });
    expect(SubScript._commands[1].condition.mock).toHaveBeenCalledTimes(1);
    expect(SubScript._commands[1].condition.mock).toHaveBeenCalledWith({
      foo: 'baz',
      descs: ['fabulous'],
    });
  });

  test('start from sub script', () => {
    MockScript._commands[2].condition.mock.fakeReturnValue(false);
    expect(
      runner(
        [
          {
            script: MockScript,
            vars: { foo: 'bar' },
            at: 'CALL',
          },
          {
            script: SubScript,
            vars: { foo: 'baz' },
            at: 'CHILD_PROMPT',
          },
        ],
        { event: { text: 'inside' } }
      )
    ).toEqual({
      finished: true,
      stack: undefined,
      content: ['empty', 'world'],
    });
    expect(MockScript._commands[0].render.mock).toHaveBeenCalledTimes(1);
    expect(MockScript._commands[1].setter.mock).toHaveBeenCalledTimes(1);
    expect(MockScript._commands[2].condition.mock).toHaveBeenCalledTimes(1);
    expect(MockScript._commands[4].withVars.mock).not.toHaveBeenCalled();
    expect(MockScript._commands[2].condition.mock).toHaveBeenCalledTimes(1);

    expect(SubScript._commands[0].render.mock).not.toHaveBeenCalled();
    expect(SubScript._commands[1].condition.mock).not.toHaveBeenCalled();
    expect(SubScript._commands[2].setter.mock).toHaveBeenCalledTimes(1);
    expect(SubScript._commands[2].setter.mock).toHaveBeenCalledWith(
      { foo: 'baz' },
      { event: { text: 'inside' } }
    );
  });
});
