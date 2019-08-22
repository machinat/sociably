import moxy from 'moxy';
import { initRuntime, continueRuntime } from '../runtime';

const testCommandsBehavior = runScript => {
  const run = (commands, vars) =>
    runScript(
      {
        name: 'Script',
        _commands: commands,
        _keyMapping: new Map(),
      },
      vars
    );

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
    expect(run([contentCommand], { foo: 'bar' })).toEqual({
      finished: true,
      content: ['hello world'],
      stack: undefined,
    });
    expect(contentCommand.render.mock).toHaveBeenCalledTimes(1);
    expect(contentCommand.render.mock).toHaveBeenCalledWith({ foo: 'bar' });

    // multiple content commands
    contentCommand.render.mock.fakeReturnValueOnce('hello');
    contentCommand.render.mock.fakeReturnValueOnce('world');
    expect(run([contentCommand, contentCommand], { foo: 'bar' })).toEqual({
      finished: true,
      content: ['hello', 'world'],
      stack: undefined,
    });
    expect(contentCommand.render.mock).toHaveBeenCalledTimes(3);
  });

  test('run set_vars command', () => {
    expect(
      run(
        [
          contentCommand,
          setVarsCommand,
          contentCommand,
          setVarsCommand,
          contentCommand,
        ],
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
    expect(
      run([contentCommand, setVarsCommand, promptCommand, contentCommand], {
        foo: 'bar',
        t: 0,
      })
    ).toEqual({
      finished: false,
      content: ['hi#0'],
      stack: [
        { name: 'Script', vars: { foo: 'bar', t: 1 }, stoppedAt: 'prompt#0' },
      ],
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
    const commands = [
      { type: 'call', script: subScript },
      { type: 'content', render: moxy(() => 'yaaaaaay') },
    ];

    expect(run(commands, { foo: 'bar' })).toEqual({
      finished: true,
      content: ['hello the other side', 'yaaaaaay'],
      stack: undefined,
    });
    expect(subScript._commands[0].render.mock).toHaveBeenCalledTimes(1);
    expect(subScript._commands[0].render.mock).toHaveBeenCalledWith({});
    expect(commands[1].render.mock).toHaveBeenCalledTimes(1);
    expect(commands[1].render.mock).toHaveBeenCalledWith({ foo: 'bar' });
  });

  test('run call command with withVars', () => {
    const subScript = {
      name: 'SubScript',
      _commands: [{ type: 'content', render: moxy(() => 'at skyfall') }],
      _keyMapping: new Map(),
    };
    const commands = [
      {
        type: 'call',
        script: subScript,
        withVars: moxy(() => ({ foo: 'baz' })),
      },
      { type: 'content', render: moxy(() => 'awwww awwww awwwwwwwwww') },
    ];

    expect(run(commands, { foo: 'bar' })).toEqual({
      finished: true,
      content: ['at skyfall', 'awwww awwww awwwwwwwwww'],
      stack: undefined,
    });
    expect(subScript._commands[0].render.mock).toHaveBeenCalledTimes(1);
    expect(subScript._commands[0].render.mock).toHaveBeenCalledWith({
      foo: 'baz',
    });
    expect(commands[0].withVars.mock).toHaveBeenCalledTimes(1);
    expect(commands[0].withVars.mock).toHaveBeenCalledWith({ foo: 'bar' });
    expect(commands[1].render.mock).toHaveBeenCalledTimes(1);
    expect(commands[1].render.mock).toHaveBeenCalledWith({ foo: 'bar' });
  });

  test('run call command if sub-script not finished', () => {
    const subScript = {
      name: 'SubScript',
      _commands: [
        { type: 'content', render: moxy(() => "i can't go back") },
        { type: 'prompt', setter: () => ({}), key: 'childPrompt' },
      ],
      _keyMapping: new Map(),
    };
    const commands = [
      {
        type: 'call',
        script: subScript,
        withVars: moxy(() => ({ foo: 'baz' })),
        key: 'motherCall',
      },
      { type: 'content', render: moxy(() => 'to River Rea') },
    ];

    expect(run(commands, { foo: 'bar' })).toEqual({
      finished: false,
      content: ["i can't go back"],
      stack: [
        { name: 'Script', vars: { foo: 'bar' }, stoppedAt: 'motherCall' },
        { name: 'SubScript', vars: { foo: 'baz' }, stoppedAt: 'childPrompt' },
      ],
    });
    expect(subScript._commands[0].render.mock).toHaveBeenCalledTimes(1);
    expect(subScript._commands[0].render.mock).toHaveBeenCalledWith({
      foo: 'baz',
    });
    expect(commands[1].render.mock).not.toHaveBeenCalled();
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
      run([{ type: 'call', script: subScript, gotoKey: 'where_is_it' }], {})
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
    const commands = [
      { type: 'content', render: () => 'foo' },
      { type: 'jump', index: 3 },
      { type: 'content', render: moxy(() => 'bar') },
      { type: 'content', render: () => 'baz' },
    ];
    expect(run(commands, {})).toEqual({
      finished: true,
      content: ['foo', 'baz'],
      stack: undefined,
    });
    expect(commands[2].render.mock).not.toHaveBeenCalled();
  });

  test('run jump command to overflow index', () => {
    const commands = [
      { type: 'content', render: () => 'foo' },
      { type: 'jump', index: 3 },
      { type: 'content', render: moxy(() => 'bar') },
    ];
    expect(run(commands, {})).toEqual({
      finished: true,
      content: ['foo'],
      stack: undefined,
    });
    expect(commands[2].render.mock).not.toHaveBeenCalled();
  });

  test('run jump_cond command', () => {
    const commands = [
      { type: 'content', render: () => 'foo' },
      {
        type: 'jump_cond',
        condition: moxy(() => true),
        isNot: false,
        index: 3,
      },
      { type: 'content', render: moxy(() => 'bar') },
      { type: 'content', render: () => 'baz' },
    ];
    expect(run(commands, {})).toEqual({
      finished: true,
      content: ['foo', 'baz'],
      stack: undefined,
    });
    expect(commands[2].render.mock).not.toHaveBeenCalled();

    commands[1].condition.mock.fakeReturnValue(false);
    expect(run(commands, {})).toEqual({
      finished: true,
      content: ['foo', 'bar', 'baz'],
      stack: undefined,
    });
    expect(commands[2].render.mock).toHaveBeenCalledTimes(1);
  });

  test('run jump_cond command with isNot set to true', () => {
    const commands = [
      { type: 'content', render: () => 'foo' },
      { type: 'jump_cond', condition: moxy(() => true), isNot: true, index: 3 },
      { type: 'content', render: moxy(() => 'bar') },
      { type: 'content', render: () => 'baz' },
    ];
    expect(run(commands, {})).toEqual({
      finished: true,
      content: ['foo', 'bar', 'baz'],
      stack: undefined,
    });
    expect(commands[2].render.mock).toHaveBeenCalledTimes(1);

    commands[1].condition.mock.fakeReturnValue(false);
    expect(run(commands, {})).toEqual({
      finished: true,
      content: ['foo', 'baz'],
      stack: undefined,
    });
    expect(commands[2].render.mock).toHaveBeenCalledTimes(1);
  });
};

const SubScript = {
  name: 'SubScript',
  _commands: [
    { type: 'content', render: () => 'wonderful ' },
    { type: 'jump_cond', condition: () => true, isNot: true, index: 3 },
    { type: 'prompt', setter: () => ({}) },
  ],
  _keyMapping: new Map(),
};

const MockScript = moxy({
  name: 'MockScript',
  _commands: [
    { type: 'content', render: () => 'hello ' },
    { type: 'set_vars', setter: ({ t }) => ({ t: (t || 0) + 1 }) },
    { type: 'jump_cond', condition: () => true, isNot: true, index: 7 },
    { type: 'prompt', setter: () => ({}), key: 'prompt#0' },
    {
      type: 'call',
      script: SubScript,
      withVars: () => ({}),
      gotoKey: 'a',
      key: 'call#1',
    },
    { type: 'content', render: () => 'world ' },
    { type: 'jump', index: 0 },
  ],
  _keyMapping: new Map(),
});

beforeEach(() => {
  MockScript.mock.reset();
});

describe('initRuntime', () => {
  testCommandsBehavior((script, vars) => initRuntime(script, vars));

  test('start from 0', () => {
    expect(initRuntime(MockScript, { foo: 'bar' })).toEqual({
      finished: false,
      stack: [
        {
          name: 'MockScript',
          vars: { foo: 'bar', t: 1 },
          stoppedAt: 'prompt#0',
        },
      ],
      content: ['hello '],
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
  });
});

describe('continueRuntime', () => {
  testCommandsBehavior((_script, vars) => {
    const script = {
      ..._script,
      _commands: [
        ..._script._commands,
        { type: 'jump', index: _script._commands.length + 3 },
        { type: 'prompt', setter: () => ({}), key: 'worm_hole' },
        { type: 'jump', index: 0 },
      ],
      _keyMapping: new Map([['worm_hole', _script._commands.length + 1]]),
    };
    return continueRuntime(
      [script],
      [{ name: script.name, vars, stoppedAt: 'worm_hole' }]
    );
  });
});
