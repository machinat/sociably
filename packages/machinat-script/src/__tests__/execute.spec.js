import moxy from 'moxy';
import { container } from '@machinat/core/service';
import execute from '../execute';

const delay = (t) => new Promise((resolve) => setTimeout(resolve, t));

const scope = moxy({
  injectContainer(containerFn) {
    return containerFn('FOO_SERVICE');
  },
});

const channel = { platform: 'test', uid: '_MY_CHANNEL_' };

const mockScript = (commands, entryKeysIndex, name) =>
  moxy(
    {
      name: name || 'MockScript',
      commands,
      entryKeysIndex: entryKeysIndex || new Map(),
    },
    { excludeProps: ['entryKeysIndex'] }
  );

describe('executing content command', () => {
  test('with sync render function', async () => {
    const contentCommand = {
      type: 'content',
      render: moxy(() => 'hello world'),
    };
    await expect(
      execute(
        scope,
        channel,
        [{ script: mockScript([contentCommand]), vars: { foo: 'bar' } }],
        false
      )
    ).resolves.toEqual({
      finished: true,
      returnValue: undefined,
      content: ['hello world'],
      stack: null,
    });
    expect(contentCommand.render.mock).toHaveBeenCalledTimes(1);
    expect(contentCommand.render.mock).toHaveBeenCalledWith({
      platform: 'test',
      channel,
      vars: { foo: 'bar' },
    });

    const contentCommand1 = { type: 'content', render: moxy(() => 'hello') };
    const contentCommand2 = { type: 'content', render: moxy(() => 'world') };
    await expect(
      execute(
        scope,
        channel,
        [
          {
            script: mockScript([contentCommand1, contentCommand2]),
            vars: { foo: 'baz' },
          },
        ],
        false
      )
    ).resolves.toEqual({
      finished: true,
      returnValue: undefined,
      content: ['hello', 'world'],
      stack: null,
    });
    expect(contentCommand1.render.mock).toHaveBeenCalledTimes(1);
    expect(contentCommand1.render.mock).toHaveBeenCalledWith({
      platform: 'test',
      channel,
      vars: { foo: 'baz' },
    });
    expect(contentCommand2.render.mock).toHaveBeenCalledTimes(1);
    expect(contentCommand2.render.mock).toHaveBeenCalledWith({
      platform: 'test',
      channel,
      vars: { foo: 'baz' },
    });
  });

  test('with async render function', async () => {
    const commands = moxy([
      { type: 'content', render: () => 'hello' },
      {
        type: 'content',
        render: async () => {
          await delay(10);
          return 'it is an';
        },
      },
      { type: 'content', render: async () => 'async' },
      { type: 'content', render: () => 'world' },
    ]);

    await expect(
      execute(
        scope,
        channel,
        [{ script: mockScript(commands), vars: { foo: 'bar' } }],
        false
      )
    ).resolves.toEqual({
      finished: true,
      returnValue: undefined,
      content: ['hello', 'it is an', 'async', 'world'],
      stack: null,
    });
    for (const { render } of commands) {
      expect(render.mock).toHaveBeenCalledTimes(1);
      expect(render.mock).toHaveBeenCalledWith({
        platform: 'test',
        channel,
        vars: { foo: 'bar' },
      });
    }
  });

  test('with async render container', async () => {
    const render = moxy(async () => 'a contained');
    const renderContainer = moxy(container({ deps: [] })(() => render));

    await expect(
      execute(
        scope,
        channel,
        [
          {
            script: mockScript([
              { type: 'content', render: async () => 'hello' },
              { type: 'content', render: renderContainer },
              { type: 'content', render: () => 'world' },
            ]),
            vars: { foo: 'bar' },
          },
        ],
        false
      )
    ).resolves.toEqual({
      finished: true,
      returnValue: undefined,
      content: ['hello', 'a contained', 'world'],
      stack: null,
    });
    expect(render.mock).toHaveBeenCalledTimes(1);
    expect(render.mock).toHaveBeenCalledWith({
      platform: 'test',
      channel,
      vars: { foo: 'bar' },
    });
    expect(renderContainer.mock).toHaveBeenCalledTimes(1);
    expect(renderContainer.mock).toHaveBeenCalledWith('FOO_SERVICE');
  });
});

describe('executing set_vars command', () => {
  const contentCmd = {
    type: 'content',
    render: ({ vars: { t } }) => `hi#${t}`,
  };
  const setVarsCmd = moxy({
    type: 'set_vars',
    setter: ({ vars }) => ({ ...vars, t: vars.t + 1 }),
  });
  const script = mockScript([setVarsCmd, contentCmd, setVarsCmd, contentCmd]);

  beforeEach(() => {
    setVarsCmd.setter.mock.reset();
    script.mock.reset();
  });

  test('with sync setter function', async () => {
    await expect(
      execute(scope, channel, [{ script, vars: { foo: 'bar', t: 0 } }], false)
    ).resolves.toEqual({
      finished: true,
      returnValue: undefined,
      content: ['hi#1', 'hi#2'],
      stack: null,
    });
    expect(setVarsCmd.setter.mock).toHaveBeenCalledTimes(2);
    expect(setVarsCmd.setter.mock).toHaveBeenNthCalledWith(1, {
      platform: 'test',
      channel,
      vars: { foo: 'bar', t: 0 },
    });
    expect(setVarsCmd.setter.mock).toHaveBeenNthCalledWith(2, {
      platform: 'test',
      channel,
      vars: { foo: 'bar', t: 1 },
    });
  });

  test('with async setter function', async () => {
    setVarsCmd.setter.mock.fake(async ({ vars }) => ({
      ...vars,
      t: vars.t + 1,
    }));

    await expect(
      execute(scope, channel, [{ script, vars: { foo: 'bar', t: 0 } }], false)
    ).resolves.toEqual({
      finished: true,
      returnValue: undefined,
      content: ['hi#1', 'hi#2'],
      stack: null,
    });
    expect(setVarsCmd.setter.mock).toHaveBeenCalledTimes(2);
    expect(setVarsCmd.setter.mock).toHaveBeenNthCalledWith(1, {
      platform: 'test',
      channel,
      vars: { foo: 'bar', t: 0 },
    });
    expect(setVarsCmd.setter.mock).toHaveBeenNthCalledWith(2, {
      platform: 'test',
      channel,
      vars: { foo: 'bar', t: 1 },
    });
  });

  test('with async setter container', async () => {
    const setter = moxy(async ({ vars }) => ({ ...vars, t: vars.t + 1 }));
    const setterContainer = moxy(container({ deps: [] })(() => setter));
    setVarsCmd.mock.getter('setter').fake(() => setterContainer);

    await expect(
      execute(scope, channel, [{ script, vars: { foo: 'bar', t: 0 } }], false)
    ).resolves.toEqual({
      finished: true,
      returnValue: undefined,
      content: ['hi#1', 'hi#2'],
      stack: null,
    });
    expect(setterContainer.mock).toHaveBeenCalledTimes(2);
    expect(setterContainer.mock).toHaveBeenCalledWith('FOO_SERVICE');

    expect(setter.mock).toHaveBeenCalledTimes(2);
    expect(setter.mock).toHaveBeenNthCalledWith(1, {
      platform: 'test',
      channel,
      vars: { foo: 'bar', t: 0 },
    });
    expect(setter.mock).toHaveBeenNthCalledWith(2, {
      platform: 'test',
      channel,
      vars: { foo: 'bar', t: 1 },
    });
  });
});

describe('executing prompt command', () => {
  const promptCommand = moxy({
    type: 'prompt',
    setter: ({ vars }, { answer }) => ({ ...vars, answer }),
    key: 'prompt#0',
  });

  const script = mockScript(
    [
      { type: 'content', render: () => 'foo' },
      promptCommand,
      { type: 'content', render: ({ vars: { answer } }) => answer },
    ],
    new Map([['prompt#0', 1]])
  );

  beforeEach(() => {
    promptCommand.mock.reset();
    script.mock.reset();
  });

  test('return unfinished if prompt command met', async () => {
    await expect(
      execute(scope, channel, [{ script, vars: { foo: 'bar' } }], false)
    ).resolves.toEqual({
      finished: false,
      returnValue: undefined,
      content: ['foo'],
      stack: [{ script, vars: { foo: 'bar' }, stoppedAt: 'prompt#0' }],
    });

    expect(promptCommand.setter.mock).not.toHaveBeenCalled();
  });

  test('continue from prompt with sync function setter', async () => {
    await expect(
      execute(
        scope,
        channel,
        [{ script, vars: { foo: 'bar' }, stoppedAt: 'prompt#0' }],
        true,
        { answer: 'yes' }
      )
    ).resolves.toEqual({
      finished: true,
      returnValue: undefined,
      content: ['yes'],
      stack: null,
    });

    expect(promptCommand.setter.mock).toHaveBeenCalledTimes(1);
    expect(promptCommand.setter.mock).toHaveBeenCalledWith(
      { platform: 'test', channel, vars: { foo: 'bar' } },
      { answer: 'yes' }
    );
    expect(script.commands[2].render.mock).toHaveBeenCalledWith({
      platform: 'test',
      channel,
      vars: { foo: 'bar', answer: 'yes' },
    });
  });

  test('continue with async function setter', async () => {
    promptCommand.setter.mock.fake(async ({ vars }, { answer }) => ({
      ...vars,
      answer,
    }));

    await expect(
      execute(
        scope,
        channel,
        [{ script, vars: { foo: 'bar' }, stoppedAt: 'prompt#0' }],
        true,
        { answer: 'no' }
      )
    ).resolves.toEqual({
      finished: true,
      returnValue: undefined,
      content: ['no'],
      stack: null,
    });

    expect(promptCommand.setter.mock).toHaveBeenCalledTimes(1);
    expect(promptCommand.setter.mock).toHaveBeenCalledWith(
      { platform: 'test', channel, vars: { foo: 'bar' } },
      { answer: 'no' }
    );
    expect(script.commands[2].render.mock).toHaveBeenCalledWith({
      platform: 'test',
      channel,
      vars: { foo: 'bar', answer: 'no' },
    });
  });

  test('continue with async container setter', async () => {
    const setter = moxy(async ({ vars }, { answer }) => ({ ...vars, answer }));
    const setterContainer = moxy(container({ deps: [] })(() => setter));
    promptCommand.mock.getter('setter').fake(() => setterContainer);

    await expect(
      execute(
        scope,
        channel,
        [{ script, vars: { foo: 'bar' }, stoppedAt: 'prompt#0' }],
        true,
        { answer: 'maybe' }
      )
    ).resolves.toEqual({
      finished: true,
      returnValue: undefined,
      content: ['maybe'],
      stack: null,
    });

    expect(setterContainer.mock).toHaveBeenCalledTimes(1);
    expect(setterContainer.mock).toHaveBeenCalledWith('FOO_SERVICE');

    expect(setter.mock).toHaveBeenCalledTimes(1);
    expect(setter.mock).toHaveBeenCalledWith(
      { platform: 'test', channel, vars: { foo: 'bar' } },
      { answer: 'maybe' }
    );
    expect(script.commands[2].render.mock).toHaveBeenCalledWith({
      platform: 'test',
      channel,
      vars: { foo: 'bar', answer: 'maybe' },
    });
  });
});

describe('executing call command', () => {
  test('call script with no data transfer', async () => {
    const subScript = {
      name: 'SubScript',
      commands: [{ type: 'content', render: moxy(() => 'at skyfall') }],
      entryKeysIndex: new Map(),
    };
    const script = mockScript([
      { type: 'call', script: subScript },
      { type: 'content', render: () => 'aww~awwww~awwwwwwwwww~' },
    ]);

    await expect(
      execute(scope, channel, [{ script, vars: { foo: 'bar' } }], false)
    ).resolves.toEqual({
      finished: true,
      returnValue: undefined,
      content: ['at skyfall', 'aww~awwww~awwwwwwwwww~'],
      stack: null,
    });
    expect(subScript.commands[0].render.mock).toHaveBeenCalledTimes(1);
    expect(subScript.commands[0].render.mock).toHaveBeenCalledWith({
      platform: 'test',
      channel,
      vars: {},
    });
    expect(script.commands[1].render.mock).toHaveBeenCalledTimes(1);
    expect(script.commands[1].render.mock).toHaveBeenCalledWith({
      platform: 'test',
      channel,
      vars: { foo: 'bar' },
    });
  });

  describe('call script with vars and setter', () => {
    const subScript = mockScript(
      [
        { type: 'content', render: () => 'hello the other side' },
        { type: 'return', valueGetter: () => ({ hello: 'from bottom' }) },
      ],
      null,
      'SubScript'
    );
    const callCommand = moxy({
      type: 'call',
      script: subScript,
      withVars: () => ({ hello: 'from top' }),
      setter: ({ vars }, returnValue) => ({ ...vars, ...returnValue }),
    });
    const script = mockScript([
      callCommand,
      { type: 'content', render: () => 'yaaaaaay' },
    ]);

    beforeEach(() => {
      callCommand.mock.reset();
      subScript.mock.reset();
      script.mock.reset();
    });

    test('with sync vars function', async () => {
      await expect(
        execute(scope, channel, [{ script, vars: { foo: 'bar' } }], false)
      ).resolves.toEqual({
        finished: true,
        returnValue: undefined,
        content: ['hello the other side', 'yaaaaaay'],
        stack: null,
      });
      expect(subScript.commands[1].valueGetter.mock).toHaveBeenCalledTimes(1);
      expect(subScript.commands[1].valueGetter.mock).toHaveBeenCalledWith({
        platform: 'test',
        channel,
        vars: { hello: 'from top' },
      });
      expect(script.commands[0].withVars.mock).toHaveBeenCalledTimes(1);
      expect(script.commands[0].withVars.mock).toHaveBeenCalledWith({
        platform: 'test',
        channel,
        vars: { foo: 'bar' },
      });
      expect(script.commands[0].setter.mock).toHaveBeenCalledTimes(1);
      expect(script.commands[0].setter.mock).toHaveBeenCalledWith(
        { platform: 'test', channel, vars: { foo: 'bar' } },
        { hello: 'from bottom' }
      );
      expect(script.commands[1].render.mock).toHaveBeenCalledTimes(1);
      expect(script.commands[1].render.mock).toHaveBeenCalledWith({
        platform: 'test',
        channel,
        vars: { foo: 'bar', hello: 'from bottom' },
      });
    });

    test('with async vars functions', async () => {
      callCommand.withVars.mock.fake(async () => ({ hello: 'async from top' }));
      callCommand.setter.mock.fake(async ({ vars }, returnValue) => ({
        ...vars,
        ...returnValue,
      }));

      await expect(
        execute(scope, channel, [{ script, vars: { foo: 'bar' } }], false)
      ).resolves.toEqual({
        finished: true,
        returnValue: undefined,
        content: ['hello the other side', 'yaaaaaay'],
        stack: null,
      });
      expect(subScript.commands[1].valueGetter.mock).toHaveBeenCalledTimes(1);
      expect(subScript.commands[1].valueGetter.mock).toHaveBeenCalledWith({
        platform: 'test',
        channel,
        vars: { hello: 'async from top' },
      });
      expect(script.commands[0].withVars.mock).toHaveBeenCalledTimes(1);
      expect(script.commands[0].withVars.mock).toHaveBeenCalledWith({
        platform: 'test',
        channel,
        vars: { foo: 'bar' },
      });
      expect(script.commands[0].setter.mock).toHaveBeenCalledTimes(1);
      expect(script.commands[0].setter.mock).toHaveBeenCalledWith(
        { platform: 'test', channel, vars: { foo: 'bar' } },
        { hello: 'from bottom' }
      );
    });

    test('with container vars functions', async () => {
      const withVarsFn = moxy(async () => ({ hello: 'from top container' }));
      const withVarsContainer = moxy(container({ deps: [] })(() => withVarsFn));
      const setterFn = moxy(async ({ vars }, returnValue) => ({
        ...vars,
        ...returnValue,
      }));
      const setterContainer = moxy(container({ deps: [] })(() => setterFn));

      callCommand.mock.getter('setter').fake(() => setterContainer);
      callCommand.mock.getter('withVars').fake(() => withVarsContainer);

      await expect(
        execute(scope, channel, [{ script, vars: { foo: 'bar' } }], false)
      ).resolves.toEqual({
        finished: true,
        returnValue: undefined,
        content: ['hello the other side', 'yaaaaaay'],
        stack: null,
      });
      expect(subScript.commands[1].valueGetter.mock).toHaveBeenCalledTimes(1);
      expect(subScript.commands[1].valueGetter.mock).toHaveBeenCalledWith({
        platform: 'test',
        channel,
        vars: { hello: 'from top container' },
      });
      expect(withVarsContainer.mock).toHaveBeenCalledTimes(1);
      expect(withVarsContainer.mock).toHaveBeenCalledWith('FOO_SERVICE');
      expect(withVarsFn.mock).toHaveBeenCalledTimes(1);
      expect(withVarsFn.mock).toHaveBeenCalledWith({
        platform: 'test',
        channel,
        vars: { foo: 'bar' },
      });
      expect(setterContainer.mock).toHaveBeenCalledTimes(1);
      expect(setterContainer.mock).toHaveBeenCalledWith('FOO_SERVICE');
      expect(setterFn.mock).toHaveBeenCalledTimes(1);
      expect(setterFn.mock).toHaveBeenCalledWith(
        { platform: 'test', channel, vars: { foo: 'bar' } },
        { hello: 'from bottom' }
      );
    });
  });

  test('when prompt in subscript met', async () => {
    const subScript = mockScript(
      [
        { type: 'content', render: () => "i can't go back" },
        { type: 'prompt', key: 'childPrompt' },
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

    await expect(
      execute(scope, channel, [{ script, vars: { foo: 'bar' } }], false)
    ).resolves.toEqual({
      finished: false,
      returnValue: undefined,
      content: ["i can't go back"],
      stack: [
        { script, vars: { foo: 'bar' }, stoppedAt: 'motherCall' },
        { script: subScript, vars: { foo: 'baz' }, stoppedAt: 'childPrompt' },
      ],
    });
    expect(subScript.commands[0].render.mock).toHaveBeenCalledTimes(1);
    expect(subScript.commands[0].render.mock).toHaveBeenCalledWith({
      platform: 'test',
      channel,
      vars: { foo: 'baz' },
    });
    expect(script.commands[1].render.mock).not.toHaveBeenCalled();
  });

  test('call script with goto', async () => {
    const subScript = {
      name: 'SubScript',
      commands: [
        { type: 'content', render: moxy(() => 'there is a fire') },
        { type: 'content', render: moxy(() => 'starting in my heart') },
      ],
      entryKeysIndex: new Map([['where', 1]]),
    };

    await expect(
      execute(
        scope,
        channel,
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
    ).resolves.toEqual({
      finished: true,
      returnValue: undefined,
      content: ['starting in my heart'],
      stack: null,
    });
    expect(subScript.commands[0].render.mock).not.toHaveBeenCalled();
    expect(subScript.commands[1].render.mock).toHaveBeenCalledTimes(1);
    expect(subScript.commands[1].render.mock).toHaveBeenCalledWith({
      platform: 'test',
      channel,
      vars: {},
    });
  });
});

describe('executing jump command', () => {
  test('jump', async () => {
    const script = mockScript([
      { type: 'content', render: () => 'foo' },
      { type: 'jump', offset: 2 },
      { type: 'content', render: () => 'bar' },
      { type: 'content', render: () => 'baz' },
    ]);
    await expect(
      execute(scope, channel, [{ script, vars: {} }], false)
    ).resolves.toEqual({
      finished: true,
      returnValue: undefined,
      content: ['foo', 'baz'],
      stack: null,
    });
    expect(script.commands[2].render.mock).not.toHaveBeenCalled();
  });

  test('run jump command to overflow index', async () => {
    const script = mockScript([
      { type: 'content', render: () => 'foo' },
      { type: 'jump', offset: 2 },
      { type: 'content', render: () => 'bar' },
    ]);
    await expect(
      execute(scope, channel, [{ script, vars: {} }], false)
    ).resolves.toEqual({
      finished: true,
      returnValue: undefined,
      content: ['foo'],
      stack: null,
    });
    expect(script.commands[2].render.mock).not.toHaveBeenCalled();
  });
});

describe('executing jump_condition command', () => {
  const jumpCondCommand = moxy({
    type: 'jump_cond',
    condition: () => true,
    isNot: false,
    offset: 2,
  });
  const script = mockScript([
    { type: 'content', render: () => 'foo' },
    jumpCondCommand,
    { type: 'content', render: () => 'bar' },
    { type: 'content', render: () => 'baz' },
  ]);

  beforeEach(() => {
    jumpCondCommand.mock.reset();
    script.mock.reset();
  });

  test('with sync condition function', async () => {
    await expect(
      execute(scope, channel, [{ script, vars: {} }], false)
    ).resolves.toEqual({
      finished: true,
      returnValue: undefined,
      content: ['foo', 'baz'],
      stack: null,
    });
    expect(script.commands[2].render.mock).not.toHaveBeenCalled();

    jumpCondCommand.condition.mock.fakeReturnValue(false);
    await expect(
      execute(scope, channel, [{ script, vars: {} }], false)
    ).resolves.toEqual({
      finished: true,
      returnValue: undefined,
      content: ['foo', 'bar', 'baz'],
      stack: null,
    });
    expect(script.commands[2].render.mock).toHaveBeenCalledTimes(1);
  });

  test('with async condition function', async () => {
    jumpCondCommand.condition.mock.fake(async () => true);
    await expect(
      execute(scope, channel, [{ script, vars: {} }], false)
    ).resolves.toEqual({
      finished: true,
      returnValue: undefined,
      content: ['foo', 'baz'],
      stack: null,
    });

    jumpCondCommand.condition.mock.fake(async () => false);
    await expect(
      execute(scope, channel, [{ script, vars: {} }], false)
    ).resolves.toEqual({
      finished: true,
      returnValue: undefined,
      content: ['foo', 'bar', 'baz'],
      stack: null,
    });
  });

  test('with async condition container', async () => {
    const conditionFn = moxy(async () => true);
    const conditionContainer = moxy(container({ deps: [] })(() => conditionFn));

    jumpCondCommand.mock.getter('condition').fake(() => conditionContainer);
    await expect(
      execute(scope, channel, [{ script, vars: {} }], false)
    ).resolves.toEqual({
      finished: true,
      returnValue: undefined,
      content: ['foo', 'baz'],
      stack: null,
    });

    conditionFn.mock.fake(async () => false);
    await expect(
      execute(scope, channel, [{ script, vars: {} }], false)
    ).resolves.toEqual({
      finished: true,
      returnValue: undefined,
      content: ['foo', 'bar', 'baz'],
      stack: null,
    });
  });

  test('run jump_cond command with isNot set to true', async () => {
    jumpCondCommand.mock.getter('isNot').fakeReturnValue(true);

    await expect(
      execute(scope, channel, [{ script, vars: {} }], false)
    ).resolves.toEqual({
      finished: true,
      returnValue: undefined,
      content: ['foo', 'bar', 'baz'],
      stack: null,
    });
    expect(script.commands[2].render.mock).toHaveBeenCalledTimes(1);

    script.commands[1].condition.mock.fakeReturnValue(false);
    await expect(
      execute(scope, channel, [{ script, vars: {} }], false)
    ).resolves.toEqual({
      finished: true,
      returnValue: undefined,
      content: ['foo', 'baz'],
      stack: null,
    });
    expect(script.commands[2].render.mock).toHaveBeenCalledTimes(1);
  });
});

describe('executing return command', () => {
  test('return immediatly if return command met', async () => {
    const script = mockScript([
      { type: 'content', render: () => 'hello' },
      { type: 'return' },
      { type: 'content', render: () => 'world' },
    ]);
    await expect(
      execute(scope, channel, [{ script, vars: { foo: 'bar' } }], false)
    ).resolves.toEqual({
      finished: true,
      returnValue: undefined,
      content: ['hello'],
      stack: null,
    });
    expect(script.commands[2].render.mock).not.toHaveBeenCalled();
  });

  const returnCommand = moxy({
    type: 'return',
    valueGetter: ({ vars }) => vars.foo,
  });

  const script = mockScript([
    { type: 'content', render: () => 'hello' },
    returnCommand,
  ]);

  beforeEach(() => {
    returnCommand.mock.reset();
    script.mock.reset();
  });

  test('return with sync value getter function', async () => {
    await expect(
      execute(scope, channel, [{ script, vars: { foo: 'bar' } }], false)
    ).resolves.toEqual({
      finished: true,
      returnValue: 'bar',
      content: ['hello'],
      stack: null,
    });

    expect(returnCommand.valueGetter.mock).toHaveBeenCalledTimes(1);
    expect(returnCommand.valueGetter.mock).toHaveBeenCalledWith({
      platform: 'test',
      channel,
      vars: { foo: 'bar' },
    });
  });

  test('return with sync value getter function', async () => {
    returnCommand.valueGetter.mock.fake(async ({ vars }) => vars.foo);
    await expect(
      execute(scope, channel, [{ script, vars: { foo: 'bar' } }], false)
    ).resolves.toEqual({
      finished: true,
      returnValue: 'bar',
      content: ['hello'],
      stack: null,
    });
    expect(returnCommand.valueGetter.mock).toHaveBeenCalledTimes(1);
    expect(returnCommand.valueGetter.mock).toHaveBeenCalledWith({
      platform: 'test',
      channel,
      vars: { foo: 'bar' },
    });
  });

  test('return with sync value getter container', async () => {
    const valueFn = moxy(async ({ vars }) => vars.foo);
    const valueContainer = moxy(container({ deps: [] })(() => valueFn));
    returnCommand.mock.getter('valueGetter').fake(() => valueContainer);

    await expect(
      execute(scope, channel, [{ script, vars: { foo: 'bar' } }], false)
    ).resolves.toEqual({
      finished: true,
      returnValue: 'bar',
      content: ['hello'],
      stack: null,
    });
    expect(valueContainer.mock).toHaveBeenCalledTimes(1);
    expect(valueContainer.mock).toHaveBeenCalledWith('FOO_SERVICE');

    expect(valueFn.mock).toHaveBeenCalledTimes(1);
    expect(valueFn.mock).toHaveBeenCalledWith({
      platform: 'test',
      channel,
      vars: { foo: 'bar' },
    });
  });
});

describe('run whole script', () => {
  const SubScript = mockScript(
    [
      { type: 'content', render: ({ vars: { desc } }) => desc },
      { type: 'jump_cond', condition: () => true, isNot: false, offset: 2 },
      {
        type: 'prompt',
        setter: ({ vars }, input) => ({ ...vars, ...input }),
        key: 'CHILD_PROMPT',
      },
      { type: 'return', valueGetter: ({ vars }) => vars },
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
      { type: 'return', valueGetter: ({ vars }) => vars },
      { type: 'jump_cond', condition: () => true, isNot: true, offset: 5 },
      {
        type: 'set_vars',
        setter: ({ vars }) => ({ ...vars, t: (vars.t || 0) + 1 }),
      },
      {
        type: 'prompt',
        setter: ({ vars }, { desc }) => ({ ...vars, desc }),
        key: 'PROMPT',
      },
      {
        type: 'call',
        script: SubScript,
        withVars: ({ vars: { desc } }) => ({ desc }),
        setter: ({ vars }, returnValue) => ({ ...vars, ...returnValue }),
        goto: 'BEGIN',
        key: 'CALL',
      },
      { type: 'jump', offset: -4 },
      { type: 'content', render: () => 'world' },
      { type: 'return', valueGetter: ({ vars }) => vars },
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

  test('start from begin', async () => {
    await expect(
      execute(
        scope,
        channel,
        [{ script: MockScript, vars: { foo: 'bar' } }],
        false
      )
    ).resolves.toEqual({
      finished: false,
      returnValue: undefined,
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
    expect(commands[1].render.mock).toHaveBeenCalledWith({
      platform: 'test',
      channel,
      vars: { foo: 'bar' },
    });
    expect(commands[3].render.mock).not.toHaveBeenCalled();
    expect(commands[5].condition.mock).toHaveBeenCalledTimes(1);
    expect(commands[5].condition.mock).toHaveBeenCalledWith({
      platform: 'test',
      channel,
      vars: { foo: 'bar' },
    });
    expect(commands[6].setter.mock).toHaveBeenCalledTimes(1);
    expect(commands[6].setter.mock).toHaveBeenCalledWith({
      platform: 'test',
      channel,
      vars: { foo: 'bar' },
    });
    expect(commands[8].withVars.mock).not.toHaveBeenCalled();
    expect(commands[10].render.mock).not.toHaveBeenCalled();
  });

  test('return at middle', async () => {
    MockScript.commands[0].condition.mock.fakeReturnValue(true);
    await expect(
      execute(
        scope,
        channel,
        [{ script: MockScript, vars: { foo: 'bar' } }],
        false
      )
    ).resolves.toEqual({
      finished: true,
      returnValue: { foo: 'bar' },
      stack: null,
      content: ['bye'],
    });

    const { commands } = MockScript;
    expect(commands[0].condition.mock).toHaveBeenCalledTimes(1);
    expect(commands[1].render.mock).not.toHaveBeenCalled();
    expect(commands[3].render.mock).toHaveBeenCalledTimes(1);
    expect(commands[3].render.mock).toHaveBeenCalledWith({
      platform: 'test',
      channel,
      vars: { foo: 'bar' },
    });
    expect(commands[5].condition.mock).not.toHaveBeenCalled();
    expect(commands[6].setter.mock).not.toHaveBeenCalled();
    expect(commands[8].withVars.mock).not.toHaveBeenCalled();
    expect(commands[10].render.mock).not.toHaveBeenCalled();
  });

  test('continue from prompt within the loops', async () => {
    let stack = [
      { script: MockScript, vars: { foo: 'bar' }, stoppedAt: 'PROMPT' },
    ];

    const descriptions = ['fun', 'beautyful', 'wonderful'];
    for (const [idx, word] of descriptions.entries()) {
      const result = await execute(scope, channel, stack, true, { desc: word }); // eslint-disable-line no-await-in-loop

      expect(result).toEqual({
        finished: false,
        returnValue: undefined,
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
    await expect(
      execute(scope, channel, stack, true, { desc: 'fascinating' })
    ).resolves.toEqual({
      finished: true,
      returnValue: { foo: 'bar', t: 3, desc: 'fascinating' },
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

  test('prompt in the subscript', async () => {
    SubScript.commands[1].condition.mock.fakeReturnValue(false);
    await expect(
      execute(
        scope,
        channel,
        [{ script: MockScript, vars: { foo: 'bar' }, stoppedAt: 'PROMPT' }],
        true,
        { desc: 'fabulous' }
      )
    ).resolves.toEqual({
      finished: false,
      returnValue: undefined,
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
      platform: 'test',
      channel,
      vars: { desc: 'fabulous' },
    });
    expect(SubScript.commands[1].condition.mock).toHaveBeenCalledTimes(1);
    expect(SubScript.commands[1].condition.mock).toHaveBeenCalledWith({
      platform: 'test',
      channel,
      vars: { desc: 'fabulous' },
    });
  });

  test('start from sub script', async () => {
    MockScript.commands[5].condition.mock.fakeReturnValue(false);
    await expect(
      execute(
        scope,
        channel,
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
    ).resolves.toEqual({
      finished: true,
      returnValue: { foo: 'baz', hello: 'subscript' },
      stack: null,
      content: ['world'],
    });

    let { commands } = MockScript;
    expect(commands[0].condition.mock).not.toHaveBeenCalled();
    expect(commands[1].render.mock).not.toHaveBeenCalled();
    expect(commands[3].render.mock).not.toHaveBeenCalled();
    expect(commands[5].condition.mock).toHaveBeenCalledTimes(1);
    expect(commands[5].condition.mock).toHaveBeenCalledWith({
      platform: 'test',
      channel,
      vars: { foo: 'baz', hello: 'subscript' },
    });
    expect(commands[6].setter.mock).not.toHaveBeenCalled();
    expect(commands[8].withVars.mock).not.toHaveBeenCalled();
    expect(commands[8].setter.mock).toHaveBeenCalledTimes(1);
    expect(commands[8].setter.mock).toHaveBeenCalledWith(
      { platform: 'test', channel, vars: { foo: 'bar' } },
      { foo: 'baz', hello: 'subscript' }
    );
    expect(commands[10].render.mock).toHaveBeenCalledTimes(1);
    expect(commands[10].render.mock).toHaveBeenCalledWith({
      platform: 'test',
      channel,
      vars: { foo: 'baz', hello: 'subscript' },
    });

    ({ commands } = SubScript);
    expect(commands[0].render.mock).not.toHaveBeenCalled();
    expect(commands[1].condition.mock).not.toHaveBeenCalled();
    expect(commands[2].setter.mock).toHaveBeenCalledTimes(1);
    expect(commands[2].setter.mock).toHaveBeenCalledWith(
      { platform: 'test', channel, vars: { foo: 'baz' } },
      { hello: 'subscript' }
    );
  });
});

it('throw if stopped point key not found', async () => {
  const script = mockScript(
    [{}, {}],
    new Map([
      ['foo', 0],
      ['bar', 1],
    ]),
    'MyScript'
  );
  await expect(() =>
    execute(scope, channel, [{ script, vars: {}, stoppedAt: 'UNKNOWN' }], {})
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"key \\"UNKNOWN\\" not found in MyScript"`
  );
});

it('throw if stopped point is not <Prompt/>', async () => {
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
  await expect(() =>
    execute(scope, channel, [{ script, vars: {}, stoppedAt: 'ask' }], {
      event: { text: 'yes' },
    })
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"stopped point \\"ask\\" is not a <Prompt/>, the key mapping of MyScript might have been changed"`
  );
});

it('throw if returned point is not <Call/>', async () => {
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
  await expect(() =>
    execute(
      scope,
      channel,
      [
        { script, vars: {}, stoppedAt: 'greet' },
        { script: subScript, vars: {}, stoppedAt: 'prompt#0' },
      ],
      { event: { text: 'fine' } }
    )
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"returned point \\"greet\\" is not a <Call/>, the key mapping of MyScript might have been changed"`
  );
});
