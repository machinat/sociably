import { moxy } from '@moxyjs/moxy';
import { serviceContainer, ServiceScope } from '@sociably/core/service';
import execute from '../execute.js';

const delay = (t) => new Promise((resolve) => setTimeout(resolve, t));

const scope: ServiceScope = moxy<ServiceScope>({
  injectContainer(containerFn) {
    return containerFn('FOO_SERVICE');
  },
} as never);

const thread = { platform: 'test', uid: '_MY_THREAD_' };

const mockScript = (
  commands,
  stopPoints = {},
  name = 'MockScript',
  initVars = (input) => input || {},
  meta = null
) =>
  moxy<any>(
    {
      name,
      meta,
      commands,
      stopPointIndex: new Map(Object.entries(stopPoints)),
      initVars,
    } as never,
    { includeProperties: ['*'], excludeProperties: ['stopPointIndex'] }
  );

describe('execute content command', () => {
  test('with sync getContent function', async () => {
    const contentCommand = {
      type: 'content',
      getContent: moxy(() => 'hello world'),
    };
    await expect(
      execute(
        scope,
        thread,
        [
          {
            script: mockScript([contentCommand]),
            vars: { foo: 'bar' },
            stopAt: undefined,
          },
        ],
        false
      )
    ).resolves.toEqual({
      finished: true,
      returnedValue: undefined,
      contents: ['hello world'],
      callStack: null,
    });
    expect(contentCommand.getContent).toHaveBeenCalledTimes(1);
    expect(contentCommand.getContent).toHaveBeenCalledWith({
      platform: 'test',
      thread,
      vars: { foo: 'bar' },
      meta: null,
    });

    const contentCommand1 = {
      type: 'content',
      getContent: moxy(() => 'hello'),
    };
    const contentCommand2 = {
      type: 'content',
      getContent: moxy(() => 'world'),
    };
    await expect(
      execute(
        scope,
        thread,
        [
          {
            script: mockScript([contentCommand1, contentCommand2]),
            vars: { foo: 'baz' },
            stopAt: undefined,
          },
        ],
        false
      )
    ).resolves.toEqual({
      finished: true,
      returnedValue: undefined,
      contents: ['hello', 'world'],
      callStack: null,
    });
    expect(contentCommand1.getContent).toHaveBeenCalledTimes(1);
    expect(contentCommand1.getContent).toHaveBeenCalledWith({
      platform: 'test',
      thread,
      vars: { foo: 'baz' },
      meta: null,
    });
    expect(contentCommand2.getContent).toHaveBeenCalledTimes(1);
    expect(contentCommand2.getContent).toHaveBeenCalledWith({
      platform: 'test',
      thread,
      vars: { foo: 'baz' },
      meta: null,
    });
  });

  test('with async getContent function', async () => {
    const commands = moxy(
      [
        { type: 'content', getContent: () => 'hello' },
        {
          type: 'content',
          getContent: async () => {
            await delay(10);
            return 'it is an';
          },
        },
        { type: 'content', getContent: async () => 'async' },
        { type: 'content', getContent: () => 'world' },
      ],
      { includeProperties: ['*'] }
    );

    await expect(
      execute(
        scope,
        thread,
        [
          {
            script: mockScript(commands),
            vars: { foo: 'bar' },
            stopAt: undefined,
          },
        ],
        false
      )
    ).resolves.toEqual({
      finished: true,
      returnedValue: undefined,
      contents: ['hello', 'it is an', 'async', 'world'],
      callStack: null,
    });
    for (const { getContent } of commands) {
      expect(getContent).toHaveBeenCalledTimes(1);
      expect(getContent).toHaveBeenCalledWith({
        platform: 'test',
        thread,
        vars: { foo: 'bar' },
        meta: null,
      });
    }
  });

  test('with async getContent container', async () => {
    const getContent = moxy(async () => 'a contained');
    const getContentContainer = moxy(
      serviceContainer({ deps: [] })(() => getContent)
    );

    await expect(
      execute(
        scope,
        thread,
        [
          {
            script: mockScript([
              { type: 'content', getContent: async () => 'hello' },
              { type: 'content', getContent: getContentContainer },
              { type: 'content', getContent: () => 'world' },
            ]),
            vars: { foo: 'bar' },
            stopAt: undefined,
          },
        ],
        false
      )
    ).resolves.toEqual({
      finished: true,
      returnedValue: undefined,
      contents: ['hello', 'a contained', 'world'],
      callStack: null,
    });
    expect(getContent).toHaveBeenCalledTimes(1);
    expect(getContent).toHaveBeenCalledWith({
      platform: 'test',
      thread,
      vars: { foo: 'bar' },
      meta: null,
    });
    expect(getContentContainer).toHaveBeenCalledTimes(1);
    expect(getContentContainer).toHaveBeenCalledWith('FOO_SERVICE');
  });
});

describe('execute prompt command', () => {
  const promptCommand = moxy({
    type: 'prompt',
    setVars: ({ vars }, { answer }) => ({ ...vars, answer }),
    key: 'prompt#0',
  });

  const script = mockScript(
    [
      { type: 'content', getContent: () => 'foo' },
      promptCommand,
      { type: 'content', getContent: ({ vars: { answer } }) => answer },
    ],
    { 'prompt#0': 1 }
  );

  beforeEach(() => {
    promptCommand.mock.reset();
    script.mock.reset();
  });

  test('stop when a prompt command is met', async () => {
    await expect(
      execute(
        scope,
        thread,
        [{ script, vars: { foo: 'bar' }, stopAt: undefined }],
        false
      )
    ).resolves.toEqual({
      finished: false,
      returnedValue: undefined,
      contents: ['foo'],
      callStack: [{ script, vars: { foo: 'bar' }, stopAt: 'prompt#0' }],
    });

    expect(promptCommand.setVars).not.toHaveBeenCalled();
  });

  test('continue from prompt point', async () => {
    await expect(
      execute(
        scope,
        thread,
        [{ script, vars: { foo: 'bar' }, stopAt: 'prompt#0' }],
        true,
        { answer: 'yes' }
      )
    ).resolves.toEqual({
      finished: true,
      returnedValue: undefined,
      contents: ['yes'],
      callStack: null,
    });

    expect(promptCommand.setVars).toHaveBeenCalledTimes(1);
    expect(promptCommand.setVars).toHaveBeenCalledWith(
      { platform: 'test', thread, vars: { foo: 'bar' }, meta: null },
      { answer: 'yes' }
    );
    expect(script.commands[2].getContent).toHaveBeenCalledWith({
      platform: 'test',
      thread,
      vars: { foo: 'bar', answer: 'yes' },
      meta: null,
    });
  });

  test('continue with async setVars', async () => {
    promptCommand.setVars.mock.fake(async ({ vars }, { answer }) => ({
      ...vars,
      answer,
    }));

    await expect(
      execute(
        scope,
        thread,
        [{ script, vars: { foo: 'bar' }, stopAt: 'prompt#0' }],
        true,
        { answer: 'no' }
      )
    ).resolves.toEqual({
      finished: true,
      returnedValue: undefined,
      contents: ['no'],
      callStack: null,
    });

    expect(promptCommand.setVars).toHaveBeenCalledTimes(1);
    expect(promptCommand.setVars).toHaveBeenCalledWith(
      { platform: 'test', thread, vars: { foo: 'bar' }, meta: null },
      { answer: 'no' }
    );
    expect(script.commands[2].getContent).toHaveBeenCalledWith({
      platform: 'test',
      thread,
      vars: { foo: 'bar', answer: 'no' },
      meta: null,
    });
  });

  test('continue with async container setVars', async () => {
    const setVars = moxy(async ({ vars }, { answer }) => ({ ...vars, answer }));
    const setVarsContainer = moxy(
      serviceContainer({ deps: [] })(() => setVars)
    );
    promptCommand.mock.getter('setVars').fake(() => setVarsContainer);

    await expect(
      execute(
        scope,
        thread,
        [{ script, vars: { foo: 'bar' }, stopAt: 'prompt#0' }],
        true,
        { answer: 'maybe' }
      )
    ).resolves.toEqual({
      finished: true,
      returnedValue: undefined,
      contents: ['maybe'],
      callStack: null,
    });

    expect(setVarsContainer).toHaveBeenCalledTimes(1);
    expect(setVarsContainer).toHaveBeenCalledWith('FOO_SERVICE');

    expect(setVars).toHaveBeenCalledTimes(1);
    expect(setVars).toHaveBeenCalledWith(
      { platform: 'test', thread, vars: { foo: 'bar' }, meta: null },
      { answer: 'maybe' }
    );
    expect(script.commands[2].getContent).toHaveBeenCalledWith({
      platform: 'test',
      thread,
      vars: { foo: 'bar', answer: 'maybe' },
      meta: null,
    });
  });
});

describe('execute call command', () => {
  test('call script with no data transfer', async () => {
    const subScript = mockScript(
      [{ type: 'content', getContent: moxy(() => 'at skyfall') }],
      {},
      'ChildScript'
    );
    const script = mockScript([
      { type: 'call', script: subScript },
      { type: 'content', getContent: () => 'aww~awwww~awwwwwwwwww~' },
    ]);

    await expect(
      execute(
        scope,
        thread,
        [{ script, vars: { foo: 'bar' }, stopAt: undefined }],
        false
      )
    ).resolves.toEqual({
      finished: true,
      returnedValue: undefined,
      contents: ['at skyfall', 'aww~awwww~awwwwwwwwww~'],
      callStack: null,
    });
    expect(subScript.commands[0].getContent).toHaveBeenCalledTimes(1);
    expect(subScript.commands[0].getContent).toHaveBeenCalledWith({
      platform: 'test',
      thread,
      vars: {},
      meta: null,
    });
    expect(script.commands[1].getContent).toHaveBeenCalledTimes(1);
    expect(script.commands[1].getContent).toHaveBeenCalledWith({
      platform: 'test',
      thread,
      vars: { foo: 'bar' },
      meta: null,
    });
  });

  describe('call script with vars and setVars', () => {
    const subScript = mockScript(
      [
        { type: 'content', getContent: () => 'hello the other side' },
        { type: 'return', getValue: () => ({ hello: 'from bottom' }) },
      ],
      undefined,
      'ChildScript'
    );
    const callCommand = moxy({
      type: 'call',
      script: subScript,
      withParams: () => ({ hello: 'from top' }),
      setVars: ({ vars }, returnedValue) => ({ ...vars, ...returnedValue }),
    });
    const script = mockScript([
      callCommand,
      { type: 'content', getContent: () => 'yaaaaaay' },
    ]);

    beforeEach(() => {
      callCommand.mock.reset();
      subScript.mock.reset();
      script.mock.reset();
    });

    test('with sync vars function', async () => {
      await expect(
        execute(
          scope,
          thread,
          [{ script, vars: { foo: 'bar' }, stopAt: undefined }],
          false
        )
      ).resolves.toEqual({
        finished: true,
        returnedValue: undefined,
        contents: ['hello the other side', 'yaaaaaay'],
        callStack: null,
      });
      expect(subScript.commands[1].getValue).toHaveBeenCalledTimes(1);
      expect(subScript.commands[1].getValue).toHaveBeenCalledWith({
        platform: 'test',
        thread,
        vars: { hello: 'from top' },
        meta: null,
      });
      expect(script.commands[0].withParams).toHaveBeenCalledTimes(1);
      expect(script.commands[0].withParams).toHaveBeenCalledWith({
        platform: 'test',
        thread,
        vars: { foo: 'bar' },
        meta: null,
      });
      expect(script.commands[0].setVars).toHaveBeenCalledTimes(1);
      expect(script.commands[0].setVars).toHaveBeenCalledWith(
        { platform: 'test', thread, vars: { foo: 'bar' }, meta: null },
        { hello: 'from bottom' }
      );
      expect(script.commands[1].getContent).toHaveBeenCalledTimes(1);
      expect(script.commands[1].getContent).toHaveBeenCalledWith({
        platform: 'test',
        thread,
        vars: { foo: 'bar', hello: 'from bottom' },
        meta: null,
      });
    });

    test('with async vars functions', async () => {
      callCommand.withParams.mock.fake(async () => ({
        hello: 'async from top',
      }));
      callCommand.setVars.mock.fake(async ({ vars }, returnedValue) => ({
        ...vars,
        ...returnedValue,
      }));

      await expect(
        execute(
          scope,
          thread,
          [{ script, vars: { foo: 'bar' }, stopAt: undefined }],
          false
        )
      ).resolves.toEqual({
        finished: true,
        returnedValue: undefined,
        contents: ['hello the other side', 'yaaaaaay'],
        callStack: null,
      });
      expect(subScript.commands[1].getValue).toHaveBeenCalledTimes(1);
      expect(subScript.commands[1].getValue).toHaveBeenCalledWith({
        platform: 'test',
        thread,
        vars: { hello: 'async from top' },
        meta: null,
      });
      expect(script.commands[0].withParams).toHaveBeenCalledTimes(1);
      expect(script.commands[0].withParams).toHaveBeenCalledWith({
        platform: 'test',
        thread,
        vars: { foo: 'bar' },
        meta: null,
      });
      expect(script.commands[0].setVars).toHaveBeenCalledTimes(1);
      expect(script.commands[0].setVars).toHaveBeenCalledWith(
        { platform: 'test', thread, vars: { foo: 'bar' }, meta: null },
        { hello: 'from bottom' }
      );
    });

    test('with container vars functions', async () => {
      const withParamsFn = moxy(async () => ({ hello: 'from top container' }));
      const withParamsContainer = moxy(
        serviceContainer({ deps: [] })(() => withParamsFn)
      );
      const setVarsFn = moxy(async ({ vars }, returnedValue) => ({
        ...vars,
        ...returnedValue,
      }));
      const setVarsContainer = moxy(
        serviceContainer({ deps: [] })(() => setVarsFn)
      );

      callCommand.mock.getter('setVars').fake(() => setVarsContainer);
      callCommand.mock.getter('withParams').fake(() => withParamsContainer);

      await expect(
        execute(
          scope,
          thread,
          [{ script, vars: { foo: 'bar' }, stopAt: undefined }],
          false
        )
      ).resolves.toEqual({
        finished: true,
        returnedValue: undefined,
        contents: ['hello the other side', 'yaaaaaay'],
        callStack: null,
      });
      expect(subScript.commands[1].getValue).toHaveBeenCalledTimes(1);
      expect(subScript.commands[1].getValue).toHaveBeenCalledWith({
        platform: 'test',
        thread,
        vars: { hello: 'from top container' },
        meta: null,
      });
      expect(withParamsContainer).toHaveBeenCalledTimes(1);
      expect(withParamsContainer).toHaveBeenCalledWith('FOO_SERVICE');
      expect(withParamsFn).toHaveBeenCalledTimes(1);
      expect(withParamsFn).toHaveBeenCalledWith({
        platform: 'test',
        thread,
        vars: { foo: 'bar' },
        meta: null,
      });
      expect(setVarsContainer).toHaveBeenCalledTimes(1);
      expect(setVarsContainer).toHaveBeenCalledWith('FOO_SERVICE');
      expect(setVarsFn).toHaveBeenCalledTimes(1);
      expect(setVarsFn).toHaveBeenCalledWith(
        { platform: 'test', thread, vars: { foo: 'bar' }, meta: null },
        { hello: 'from bottom' }
      );
    });
  });

  test('when prompt in subscript met', async () => {
    const subScript = mockScript(
      [
        { type: 'content', getContent: () => "i can't go back" },
        { type: 'prompt', key: 'childPrompt' },
      ],
      {},
      'ChildScript'
    );
    const script = mockScript([
      {
        type: 'call',
        script: subScript,
        withParams: () => ({ foo: 'baz' }),
        key: 'motherCall',
      },
      { type: 'content', getContent: () => 'to River Rea' },
    ]);

    await expect(
      execute(
        scope,
        thread,
        [{ script, vars: { foo: 'bar' }, stopAt: undefined }],
        false
      )
    ).resolves.toEqual({
      finished: false,
      returnedValue: undefined,
      contents: ["i can't go back"],
      callStack: [
        { script, vars: { foo: 'bar' }, stopAt: 'motherCall' },
        { script: subScript, vars: { foo: 'baz' }, stopAt: 'childPrompt' },
      ],
    });
    expect(subScript.commands[0].getContent).toHaveBeenCalledTimes(1);
    expect(subScript.commands[0].getContent).toHaveBeenCalledWith({
      platform: 'test',
      thread,
      vars: { foo: 'baz' },
      meta: null,
    });
    expect(script.commands[1].getContent).not.toHaveBeenCalled();
  });

  test('call script with goto', async () => {
    const subScript = mockScript(
      [
        { type: 'content', getContent: moxy(() => 'there is a fire') },
        { type: 'content', getContent: moxy(() => 'starting in my heart') },
      ],
      { where: 1 },
      'ChildScript'
    );

    await expect(
      execute(
        scope,
        thread,
        [
          {
            script: mockScript([
              { type: 'call', script: subScript, goto: 'where' },
            ]),
            vars: { foo: 'bar' },
            stopAt: undefined,
          },
        ],
        false
      )
    ).resolves.toEqual({
      finished: true,
      returnedValue: undefined,
      contents: ['starting in my heart'],
      callStack: null,
    });
    expect(subScript.commands[0].getContent).not.toHaveBeenCalled();
    expect(subScript.commands[1].getContent).toHaveBeenCalledTimes(1);
    expect(subScript.commands[1].getContent).toHaveBeenCalledWith({
      platform: 'test',
      thread,
      vars: {},
      meta: null,
    });
  });
});

describe('execute jump command', () => {
  test('jump', async () => {
    const script = mockScript([
      { type: 'content', getContent: () => 'foo' },
      { type: 'jump', offset: 2 },
      { type: 'content', getContent: () => 'bar' },
      { type: 'content', getContent: () => 'baz' },
    ]);
    await expect(
      execute(scope, thread, [{ script, vars: {}, stopAt: undefined }], false)
    ).resolves.toEqual({
      finished: true,
      returnedValue: undefined,
      contents: ['foo', 'baz'],
      callStack: null,
    });
    expect(script.commands[2].getContent).not.toHaveBeenCalled();
  });

  test('run jump command to overflow index', async () => {
    const script = mockScript([
      { type: 'content', getContent: () => 'foo' },
      { type: 'jump', offset: 2 },
      { type: 'content', getContent: () => 'bar' },
    ]);
    await expect(
      execute(scope, thread, [{ script, vars: {}, stopAt: undefined }], false)
    ).resolves.toEqual({
      finished: true,
      returnedValue: undefined,
      contents: ['foo'],
      callStack: null,
    });
    expect(script.commands[2].getContent).not.toHaveBeenCalled();
  });
});

describe('execute jump_condition command', () => {
  const jumpCondCommand = moxy({
    type: 'jump_cond',
    condition: () => true,
    isNot: false,
    offset: 2,
  });
  const script = mockScript([
    { type: 'content', getContent: () => 'foo' },
    jumpCondCommand,
    { type: 'content', getContent: () => 'bar' },
    { type: 'content', getContent: () => 'baz' },
  ]);

  beforeEach(() => {
    jumpCondCommand.mock.reset();
    script.mock.reset();
  });

  test('with sync condition function', async () => {
    await expect(
      execute(scope, thread, [{ script, vars: {}, stopAt: undefined }], false)
    ).resolves.toEqual({
      finished: true,
      returnedValue: undefined,
      contents: ['foo', 'baz'],
      callStack: null,
    });
    expect(script.commands[2].getContent).not.toHaveBeenCalled();

    jumpCondCommand.condition.mock.fakeReturnValue(false);
    await expect(
      execute(scope, thread, [{ script, vars: {}, stopAt: undefined }], false)
    ).resolves.toEqual({
      finished: true,
      returnedValue: undefined,
      contents: ['foo', 'bar', 'baz'],
      callStack: null,
    });
    expect(script.commands[2].getContent).toHaveBeenCalledTimes(1);
  });

  test('with async condition function', async () => {
    jumpCondCommand.condition.mock.fake(async () => true);
    await expect(
      execute(scope, thread, [{ script, vars: {}, stopAt: undefined }], false)
    ).resolves.toEqual({
      finished: true,
      returnedValue: undefined,
      contents: ['foo', 'baz'],
      callStack: null,
    });

    jumpCondCommand.condition.mock.fake(async () => false);
    await expect(
      execute(scope, thread, [{ script, vars: {}, stopAt: undefined }], false)
    ).resolves.toEqual({
      finished: true,
      returnedValue: undefined,
      contents: ['foo', 'bar', 'baz'],
      callStack: null,
    });
  });

  test('with async condition container', async () => {
    const conditionFn = moxy(async () => true);
    const conditionContainer = moxy(
      serviceContainer({ deps: [] })(() => conditionFn)
    );

    jumpCondCommand.mock.getter('condition').fake(() => conditionContainer);
    await expect(
      execute(scope, thread, [{ script, vars: {}, stopAt: undefined }], false)
    ).resolves.toEqual({
      finished: true,
      returnedValue: undefined,
      contents: ['foo', 'baz'],
      callStack: null,
    });

    conditionFn.mock.fake(async () => false);
    await expect(
      execute(scope, thread, [{ script, vars: {}, stopAt: undefined }], false)
    ).resolves.toEqual({
      finished: true,
      returnedValue: undefined,
      contents: ['foo', 'bar', 'baz'],
      callStack: null,
    });
  });

  test('run jump_cond command with isNot set to true', async () => {
    jumpCondCommand.mock.getter('isNot').fakeReturnValue(true);

    await expect(
      execute(scope, thread, [{ script, vars: {}, stopAt: undefined }], false)
    ).resolves.toEqual({
      finished: true,
      returnedValue: undefined,
      contents: ['foo', 'bar', 'baz'],
      callStack: null,
    });
    expect(script.commands[2].getContent).toHaveBeenCalledTimes(1);

    script.commands[1].condition.mock.fakeReturnValue(false);
    await expect(
      execute(scope, thread, [{ script, vars: {}, stopAt: undefined }], false)
    ).resolves.toEqual({
      finished: true,
      returnedValue: undefined,
      contents: ['foo', 'baz'],
      callStack: null,
    });
    expect(script.commands[2].getContent).toHaveBeenCalledTimes(1);
  });
});

describe('execute return command', () => {
  test('return immediatly if return command met', async () => {
    const script = mockScript([
      { type: 'content', getContent: () => 'hello' },
      { type: 'return' },
      { type: 'content', getContent: () => 'world' },
    ]);
    await expect(
      execute(
        scope,
        thread,
        [{ script, vars: { foo: 'bar' }, stopAt: undefined }],
        false
      )
    ).resolves.toEqual({
      finished: true,
      returnedValue: undefined,
      contents: ['hello'],
      callStack: null,
    });
    expect(script.commands[2].getContent).not.toHaveBeenCalled();
  });

  const returnCommand = moxy({
    type: 'return',
    getValue: ({ vars }) => vars.foo,
  });

  const script = mockScript([
    { type: 'content', getContent: () => 'hello' },
    returnCommand,
  ]);

  beforeEach(() => {
    returnCommand.mock.reset();
    script.mock.reset();
  });

  test('return with sync getValue function', async () => {
    await expect(
      execute(
        scope,
        thread,
        [{ script, vars: { foo: 'bar' }, stopAt: undefined }],
        false
      )
    ).resolves.toEqual({
      finished: true,
      returnedValue: 'bar',
      contents: ['hello'],
      callStack: null,
    });

    expect(returnCommand.getValue).toHaveBeenCalledTimes(1);
    expect(returnCommand.getValue).toHaveBeenCalledWith({
      platform: 'test',
      thread,
      vars: { foo: 'bar' },
      meta: null,
    });
  });

  test('return with async getValue function', async () => {
    returnCommand.getValue.mock.fake(async ({ vars }) => vars.foo);
    await expect(
      execute(
        scope,
        thread,
        [{ script, vars: { foo: 'bar' }, stopAt: undefined }],
        false
      )
    ).resolves.toEqual({
      finished: true,
      returnedValue: 'bar',
      contents: ['hello'],
      callStack: null,
    });
    expect(returnCommand.getValue).toHaveBeenCalledTimes(1);
    expect(returnCommand.getValue).toHaveBeenCalledWith({
      platform: 'test',
      thread,
      vars: { foo: 'bar' },
      meta: null,
    });
  });

  test('return with async getValue container', async () => {
    const valueFn = moxy(async ({ vars }) => vars.foo);
    const valueContainer = moxy(serviceContainer({ deps: [] })(() => valueFn));
    returnCommand.mock.getter('getValue').fake(() => valueContainer);

    await expect(
      execute(
        scope,
        thread,
        [{ script, vars: { foo: 'bar' }, stopAt: undefined }],
        false
      )
    ).resolves.toEqual({
      finished: true,
      returnedValue: 'bar',
      contents: ['hello'],
      callStack: null,
    });

    expect(valueContainer).toHaveBeenCalledTimes(1);
    expect(valueContainer).toHaveBeenCalledWith('FOO_SERVICE');

    expect(valueFn).toHaveBeenCalledTimes(1);
    expect(valueFn).toHaveBeenCalledWith({
      platform: 'test',
      thread,
      vars: { foo: 'bar' },
      meta: null,
    });
  });
});

describe('execute effect command', () => {
  test('execute a side effect and set vars', async () => {
    const effectCommand = moxy({
      type: 'effect',
      setVars: () => ({ foo: 'EFFECT!' }),
    });
    const script = mockScript([
      effectCommand,
      { type: 'content', getContent: () => 'hello' },
      { type: 'return', getValue: ({ vars }) => vars },
    ]);

    await expect(
      execute(
        scope,
        thread,
        [{ script, vars: { foo: 'bar' }, stopAt: undefined }],
        false
      )
    ).resolves.toEqual({
      finished: true,
      returnedValue: { foo: 'EFFECT!' },
      contents: ['hello'],
      callStack: null,
    });

    expect(effectCommand.setVars).toHaveBeenCalledTimes(1);
    expect(effectCommand.setVars).toHaveBeenCalledWith({
      platform: 'test',
      thread,
      vars: { foo: 'bar' },
      meta: null,
    });
  });

  test('async setVars container', async () => {
    const setVarsFn = moxy(async (_) => ({ foo: 'EFFECT!' }));
    const setVarsContainer = moxy(
      serviceContainer({ deps: [] })(() => setVarsFn)
    );
    const effectCommand = moxy({ type: 'effect', setVars: setVarsContainer });
    const script = mockScript([
      effectCommand,
      { type: 'content', getContent: () => 'hello' },
      { type: 'return', getValue: ({ vars }) => vars },
    ]);

    await expect(
      execute(
        scope,
        thread,
        [{ script, vars: { foo: 'bar' }, stopAt: undefined }],
        false
      )
    ).resolves.toEqual({
      finished: true,
      returnedValue: { foo: 'EFFECT!' },
      contents: ['hello'],
      callStack: null,
    });

    expect(setVarsContainer).toHaveBeenCalledTimes(1);
    expect(setVarsContainer).toHaveBeenCalledWith('FOO_SERVICE');

    expect(setVarsFn).toHaveBeenCalledTimes(1);
    expect(setVarsFn).toHaveBeenCalledWith({
      platform: 'test',
      thread,
      vars: { foo: 'bar' },
      meta: null,
    });
  });

  test('yield a value at the end of script', async () => {
    const yieldFn = moxy((_, prev = { n: 0 }) => ({ n: prev.n + 1 }));
    const script = mockScript([
      { type: 'effect', yieldValue: yieldFn },
      { type: 'content', getContent: () => 'hello' },
      { type: 'effect', yieldValue: yieldFn, setVars: () => ({ foo: 1 }) },
      { type: 'content', getContent: () => 'world' },
      { type: 'effect', yieldValue: yieldFn, setVars: () => ({ foo: 2 }) },
    ]);

    await expect(
      execute(
        scope,
        thread,
        [{ script, vars: { foo: 0 }, stopAt: undefined }],
        false
      )
    ).resolves.toEqual({
      finished: true,
      returnedValue: undefined,
      yieldedValue: { n: 3 },
      contents: ['hello', 'world'],
      callStack: null,
    });

    expect(yieldFn).toHaveBeenCalledTimes(3);
    expect(yieldFn).toHaveBeenNthCalledWith(
      1,
      { platform: 'test', thread, vars: { foo: 2 }, meta: null },
      undefined
    );
    expect(yieldFn).toHaveBeenNthCalledWith(
      2,
      { platform: 'test', thread, vars: { foo: 1 }, meta: null },
      { n: 1 }
    );
    expect(yieldFn).toHaveBeenNthCalledWith(
      3,
      { platform: 'test', thread, vars: { foo: 0 }, meta: null },
      { n: 2 }
    );
  });

  test('yield with async container yieldValue', async () => {
    const yieldFn = moxy(async (_, prev = { n: 0 }) => ({ n: prev.n + 1 }));
    const yieldContainer = moxy(serviceContainer({ deps: [] })(() => yieldFn));
    const script = mockScript([
      { type: 'effect', yieldValue: yieldContainer },
      { type: 'content', getContent: () => 'hello' },
      {
        type: 'effect',
        yieldValue: yieldContainer,
        setVars: () => ({ foo: 1 }),
      },
    ]);

    await expect(
      execute(
        scope,
        thread,
        [{ script, vars: { foo: 0 }, stopAt: undefined }],
        false
      )
    ).resolves.toEqual({
      finished: true,
      returnedValue: undefined,
      yieldedValue: { n: 2 },
      contents: ['hello'],
      callStack: null,
    });

    expect(yieldContainer).toHaveBeenCalledTimes(2);
    expect(yieldContainer).toHaveBeenCalledWith('FOO_SERVICE');

    expect(yieldFn).toHaveBeenCalledTimes(2);
    expect(yieldFn).toHaveBeenNthCalledWith(
      1,
      { platform: 'test', thread, vars: { foo: 1 }, meta: null },
      undefined
    );
    expect(yieldFn).toHaveBeenNthCalledWith(
      2,
      { platform: 'test', thread, vars: { foo: 0 }, meta: null },
      { n: 1 }
    );
  });

  test('yield a value when prompting', async () => {
    const yieldFn = moxy((_, prev = { n: 0 }) => ({ n: prev.n + 1 }));
    const script = mockScript(
      [
        { type: 'effect', yieldValue: yieldFn },
        { type: 'content', getContent: () => 'hello' },
        { type: 'effect', yieldValue: yieldFn, setVars: () => ({ foo: 1 }) },
        { type: 'prompt', key: 'ask' },
        { type: 'content', getContent: () => 'world' },
        { type: 'effect', yieldValue: yieldFn },
      ],
      { ask: 3 }
    );

    await expect(
      execute(
        scope,
        thread,
        [{ script, vars: { foo: 0 }, stopAt: undefined }],
        false
      )
    ).resolves.toEqual({
      finished: false,
      returnedValue: undefined,
      yieldedValue: { n: 2 },
      contents: ['hello'],
      callStack: [{ script, stopAt: 'ask', vars: { foo: 1 } }],
    });

    expect(yieldFn).toHaveBeenCalledTimes(2);
    expect(yieldFn).toHaveBeenNthCalledWith(
      1,
      { platform: 'test', thread, vars: { foo: 1 }, meta: null },
      undefined
    );
    expect(yieldFn).toHaveBeenNthCalledWith(
      2,
      { platform: 'test', thread, vars: { foo: 0 }, meta: null },
      { n: 1 }
    );

    await expect(
      execute(
        scope,
        thread,
        [{ script, vars: { foo: 1 }, stopAt: 'ask' }],
        true,
        null
      )
    ).resolves.toEqual({
      finished: true,
      returnedValue: undefined,
      yieldedValue: { n: 1 },
      contents: ['world'],
      callStack: null,
    });

    expect(yieldFn).toHaveBeenCalledTimes(3);
    expect(yieldFn).toHaveBeenNthCalledWith(
      3,
      { platform: 'test', thread, vars: { foo: 1 }, meta: null },
      undefined
    );
  });

  test('yield values with subscript', async () => {
    const yieldFn = moxy((_, prev = { n: 0 }) => ({ n: prev.n + 1 }));
    const subscript = mockScript(
      [
        { type: 'effect', yieldValue: yieldFn },
        { type: 'content', getContent: () => 'a' },
        { type: 'prompt', key: 'ask' },
        { type: 'content', getContent: () => 'b' },
        { type: 'effect', yieldValue: yieldFn, setVars: () => ({ bar: 1 }) },
      ],
      { ask: 2 },
      'Child',
      () => ({ bar: 0 })
    );
    const script = mockScript(
      [
        { type: 'effect', yieldValue: yieldFn },
        { type: 'content', getContent: () => 'c' },
        { type: 'call', key: 'child', script: subscript },
        { type: 'content', getContent: () => 'd' },
        { type: 'effect', yieldValue: yieldFn, setVars: () => ({ foo: 1 }) },
      ],
      { child: 2 }
    );

    await expect(
      execute(
        scope,
        thread,
        [{ script, vars: { foo: 0 }, stopAt: undefined }],
        false
      )
    ).resolves.toEqual({
      finished: false,
      returnedValue: undefined,
      yieldedValue: { n: 2 },
      contents: ['c', 'a'],
      callStack: [
        { script, stopAt: 'child', vars: { foo: 0 } },
        { script: subscript, stopAt: 'ask', vars: { bar: 0 } },
      ],
    });

    expect(yieldFn).toHaveBeenCalledTimes(2);
    expect(yieldFn).toHaveBeenNthCalledWith(
      1,
      { platform: 'test', thread, vars: { bar: 0 }, meta: null },
      undefined
    );
    expect(yieldFn).toHaveBeenNthCalledWith(
      2,
      { platform: 'test', thread, vars: { foo: 0 }, meta: null },
      { n: 1 }
    );

    await expect(
      execute(
        scope,
        thread,
        [
          { script, stopAt: 'child', vars: { foo: 0 } },
          { script: subscript, stopAt: 'ask', vars: { bar: 0 } },
        ],
        true,
        null
      )
    ).resolves.toEqual({
      finished: true,
      returnedValue: undefined,
      yieldedValue: { n: 2 },
      contents: ['b', 'd'],
      callStack: null,
    });

    expect(yieldFn).toHaveBeenCalledTimes(4);
    expect(yieldFn).toHaveBeenNthCalledWith(
      3,
      { platform: 'test', thread, vars: { foo: 1 }, meta: null },
      undefined
    );
    expect(yieldFn).toHaveBeenNthCalledWith(
      4,
      { platform: 'test', thread, vars: { bar: 1 }, meta: null },
      { n: 1 }
    );
  });

  test('yield values with no-prompt subscript', async () => {
    const yieldFn = moxy((_, prev = { n: 0 }) => ({ n: prev.n + 1 }));
    const subscript = mockScript(
      [
        { type: 'effect', yieldValue: yieldFn },
        { type: 'content', getContent: () => 'a' },
      ],
      { ask: 2 },
      'Child',
      () => ({ bar: 0 })
    );
    const script = mockScript(
      [
        { type: 'effect', yieldValue: yieldFn },
        { type: 'content', getContent: () => 'b' },
        { type: 'call', key: 'child', script: subscript },
        { type: 'content', getContent: () => 'c' },
        { type: 'effect', yieldValue: yieldFn, setVars: () => ({ foo: 1 }) },
      ],
      { child: 2 }
    );

    await expect(
      execute(
        scope,
        thread,
        [{ script, vars: { foo: 0 }, stopAt: undefined }],
        false
      )
    ).resolves.toEqual({
      finished: true,
      returnedValue: undefined,
      yieldedValue: { n: 3 },
      contents: ['b', 'a', 'c'],
      callStack: null,
    });

    expect(yieldFn).toHaveBeenCalledTimes(3);
    expect(yieldFn).toHaveBeenNthCalledWith(
      1,
      { platform: 'test', thread, vars: { foo: 1 }, meta: null },
      undefined
    );
    expect(yieldFn).toHaveBeenNthCalledWith(
      2,
      { platform: 'test', thread, vars: { bar: 0 }, meta: null },
      { n: 1 }
    );
    expect(yieldFn).toHaveBeenNthCalledWith(
      3,
      { platform: 'test', thread, vars: { foo: 0 }, meta: null },
      { n: 2 }
    );
  });
});

describe('run whole script', () => {
  const ChildScript = mockScript(
    [
      { type: 'content', getContent: ({ vars: { desc } }) => desc },
      { type: 'jump_cond', condition: () => true, isNot: false, offset: 2 },
      {
        type: 'prompt',
        setVars: ({ vars }, input) => ({ ...vars, ...input }),
        key: 'CHILD_PROMPT',
      },
      { type: 'return', getValue: ({ vars }) => vars },
    ],
    { BEGIN: 0, CHILD_PROMPT: 2 },
    'ChildScript'
  );

  const MockScript = mockScript(
    [
      { type: 'jump_cond', condition: () => false, isNot: false, offset: 3 },
      { type: 'content', getContent: () => 'hello' },
      { type: 'jump', offset: 3 },
      { type: 'content', getContent: () => 'bye' },
      { type: 'return', getValue: ({ vars }) => vars },
      { type: 'jump_cond', condition: () => true, isNot: true, offset: 5 },
      {
        type: 'effect',
        setVars: ({ vars }) => ({ ...vars, t: (vars.t || 0) + 1 }),
      },
      {
        type: 'prompt',
        setVars: ({ vars }, { desc }) => ({ ...vars, desc }),
        key: 'PROMPT',
      },
      {
        type: 'call',
        script: ChildScript,
        withParams: ({ vars: { desc } }) => ({ desc }),
        setVars: ({ vars }, returnedValue) => ({ ...vars, ...returnedValue }),
        goto: 'BEGIN',
        key: 'CALL',
      },
      { type: 'jump', offset: -4 },
      { type: 'content', getContent: () => 'world' },
      { type: 'return', getValue: ({ vars }) => vars },
    ],
    { BEGIN: 0, PROMPT: 7, CALL: 8 },
    'MockScript',
    (input) => ({ ...input, t: 0 })
  );

  beforeEach(() => {
    MockScript.mock.reset();
    ChildScript.mock.reset();
  });

  test('start from begin', async () => {
    await expect(
      execute(
        scope,
        thread,
        [{ script: MockScript, vars: { foo: 'bar' }, stopAt: undefined }],
        false
      )
    ).resolves.toEqual({
      finished: false,
      returnedValue: undefined,
      callStack: [
        {
          script: MockScript,
          vars: { foo: 'bar', t: 1 },
          stopAt: 'PROMPT',
        },
      ],
      contents: ['hello'],
    });

    const { commands } = MockScript;
    expect(commands[0].condition).toHaveBeenCalledTimes(1);
    expect(commands[1].getContent).toHaveBeenCalledTimes(1);
    expect(commands[1].getContent).toHaveBeenCalledWith({
      platform: 'test',
      thread,
      vars: { foo: 'bar' },
      meta: null,
    });
    expect(commands[3].getContent).not.toHaveBeenCalled();
    expect(commands[5].condition).toHaveBeenCalledTimes(1);
    expect(commands[5].condition).toHaveBeenCalledWith({
      platform: 'test',
      thread,
      vars: { foo: 'bar' },
      meta: null,
    });
    expect(commands[6].setVars).toHaveBeenCalledTimes(1);
    expect(commands[6].setVars).toHaveBeenCalledWith({
      platform: 'test',
      thread,
      vars: { foo: 'bar' },
      meta: null,
    });
    expect(commands[8].withParams).not.toHaveBeenCalled();
    expect(commands[10].getContent).not.toHaveBeenCalled();

    expect(MockScript.initVars).not.toHaveBeenCalled();
  });

  test('return at middle', async () => {
    MockScript.commands[0].condition.mock.fakeReturnValue(true);
    await expect(
      execute(
        scope,
        thread,
        [{ script: MockScript, vars: { foo: 'bar' }, stopAt: undefined }],
        false
      )
    ).resolves.toEqual({
      finished: true,
      returnedValue: { foo: 'bar' },
      callStack: null,
      contents: ['bye'],
    });

    const { commands } = MockScript;
    expect(commands[0].condition).toHaveBeenCalledTimes(1);
    expect(commands[1].getContent).not.toHaveBeenCalled();
    expect(commands[3].getContent).toHaveBeenCalledTimes(1);
    expect(commands[3].getContent).toHaveBeenCalledWith({
      platform: 'test',
      thread,
      vars: { foo: 'bar' },
      meta: null,
    });
    expect(commands[5].condition).not.toHaveBeenCalled();
    expect(commands[6].setVars).not.toHaveBeenCalled();
    expect(commands[8].withParams).not.toHaveBeenCalled();
    expect(commands[10].getContent).not.toHaveBeenCalled();
  });

  test('continue from prompt within the loops', async () => {
    let callStack: any = [
      { script: MockScript, vars: { foo: 'bar' }, stopAt: 'PROMPT' },
    ];

    const descriptions = ['fun', 'beautyful', 'wonderful'];
    for (const [idx, word] of descriptions.entries()) {
      // eslint-disable-next-line no-await-in-loop
      const result = await execute(scope, thread, callStack, true, {
        desc: word,
      });

      expect(result).toEqual({
        finished: false,
        returnedValue: undefined,
        callStack: [
          {
            script: MockScript,
            vars: { foo: 'bar', desc: word, t: idx + 1 },
            stopAt: 'PROMPT',
          },
        ],
        contents: [word],
      });
      ({ callStack } = result);
    }

    MockScript.commands[5].condition.mock.fakeReturnValue(false);
    await expect(
      execute(scope, thread, callStack, true, { desc: 'fascinating' })
    ).resolves.toEqual({
      finished: true,
      returnedValue: { foo: 'bar', t: 3, desc: 'fascinating' },
      callStack: null,
      contents: ['fascinating', 'world'],
    });

    expect(MockScript.initVars).not.toHaveBeenCalled();

    const { commands } = MockScript;
    expect(commands[0].condition).not.toHaveBeenCalled();
    expect(commands[1].getContent).not.toHaveBeenCalled();
    expect(commands[3].getContent).not.toHaveBeenCalled();
    expect(commands[5].condition).toHaveBeenCalledTimes(4);
    expect(commands[6].setVars).toHaveBeenCalledTimes(3);
    expect(commands[8].withParams).toHaveBeenCalledTimes(4);
    expect(commands[10].getContent).toHaveBeenCalledTimes(1);

    expect(ChildScript.commands[0].getContent).toHaveBeenCalledTimes(4);
    expect(ChildScript.commands[1].condition).toHaveBeenCalledTimes(4);

    expect(ChildScript.initVars).toHaveBeenCalledTimes(4);
    expect(MockScript.initVars).not.toHaveBeenCalled();
  });

  test('prompt in the subscript', async () => {
    ChildScript.commands[1].condition.mock.fakeReturnValue(false);
    await expect(
      execute(
        scope,
        thread,
        [{ script: MockScript, vars: { foo: 'bar' }, stopAt: 'PROMPT' }],
        true,
        { desc: 'fabulous' }
      )
    ).resolves.toEqual({
      finished: false,
      returnedValue: undefined,
      callStack: [
        {
          script: MockScript,
          vars: { foo: 'bar', desc: 'fabulous' },
          stopAt: 'CALL',
        },
        {
          script: ChildScript,
          vars: { desc: 'fabulous' },
          stopAt: 'CHILD_PROMPT',
        },
      ],
      contents: ['fabulous'],
    });

    const { commands } = MockScript;
    expect(commands[0].condition).not.toHaveBeenCalled();
    expect(commands[1].getContent).not.toHaveBeenCalled();
    expect(commands[3].getContent).not.toHaveBeenCalled();
    expect(commands[5].condition).not.toHaveBeenCalled();
    expect(commands[6].setVars).not.toHaveBeenCalled();
    expect(commands[8].withParams).toHaveBeenCalledTimes(1);
    expect(commands[10].getContent).not.toHaveBeenCalled();

    expect(ChildScript.commands[0].getContent).toHaveBeenCalledTimes(1);
    expect(ChildScript.commands[0].getContent).toHaveBeenCalledWith({
      platform: 'test',
      thread,
      vars: { desc: 'fabulous' },
      meta: null,
    });
    expect(ChildScript.commands[1].condition).toHaveBeenCalledTimes(1);
    expect(ChildScript.commands[1].condition).toHaveBeenCalledWith({
      platform: 'test',
      thread,
      vars: { desc: 'fabulous' },
      meta: null,
    });

    expect(ChildScript.initVars).toHaveBeenCalledTimes(1);
    expect(MockScript.initVars).not.toHaveBeenCalled();
  });

  test('start from child script', async () => {
    MockScript.commands[5].condition.mock.fakeReturnValue(false);
    await expect(
      execute(
        scope,
        thread,
        [
          {
            script: MockScript,
            vars: { foo: 'bar' },
            stopAt: 'CALL',
          },
          {
            script: ChildScript,
            vars: { foo: 'baz' },
            stopAt: 'CHILD_PROMPT',
          },
        ],
        true,
        { hello: 'subscript' }
      )
    ).resolves.toEqual({
      finished: true,
      returnedValue: { foo: 'baz', hello: 'subscript' },
      callStack: null,
      contents: ['world'],
    });

    expect(MockScript.initVars).not.toHaveBeenCalled();

    let { commands } = MockScript;
    expect(commands[0].condition).not.toHaveBeenCalled();
    expect(commands[1].getContent).not.toHaveBeenCalled();
    expect(commands[3].getContent).not.toHaveBeenCalled();
    expect(commands[5].condition).toHaveBeenCalledTimes(1);
    expect(commands[5].condition).toHaveBeenCalledWith({
      platform: 'test',
      thread,
      vars: { foo: 'baz', hello: 'subscript' },
      meta: null,
    });
    expect(commands[6].setVars).not.toHaveBeenCalled();
    expect(commands[8].withParams).not.toHaveBeenCalled();
    expect(commands[8].setVars).toHaveBeenCalledTimes(1);
    expect(commands[8].setVars).toHaveBeenCalledWith(
      { platform: 'test', thread, vars: { foo: 'bar' }, meta: null },
      { foo: 'baz', hello: 'subscript' }
    );
    expect(commands[10].getContent).toHaveBeenCalledTimes(1);
    expect(commands[10].getContent).toHaveBeenCalledWith({
      platform: 'test',
      thread,
      vars: { foo: 'baz', hello: 'subscript' },
      meta: null,
    });

    ({ commands } = ChildScript);
    expect(commands[0].getContent).not.toHaveBeenCalled();
    expect(commands[1].condition).not.toHaveBeenCalled();
    expect(commands[2].setVars).toHaveBeenCalledTimes(1);
    expect(commands[2].setVars).toHaveBeenCalledWith(
      { platform: 'test', thread, vars: { foo: 'baz' }, meta: null },
      { hello: 'subscript' }
    );

    expect(MockScript.initVars).not.toHaveBeenCalled();
    expect(ChildScript.initVars).not.toHaveBeenCalled();
  });
});

it('throw if stopped point key not found', async () => {
  const script = mockScript([{}, {}], { foo: 0, bar: 1 }, 'MyScript');
  await expect(() =>
    execute(scope, thread, [{ script, vars: {}, stopAt: 'UNKNOWN' }], true, {})
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"key "UNKNOWN" not found in MyScript"`
  );
});

it('throw if stopped point is not <Prompt/>', async () => {
  const script = mockScript(
    [
      { type: 'content', getContent: () => 'R U Cathy?' },
      { type: 'prompt', key: 'prompt#0' },
    ],
    { ask: 0, 'prompt#0': 1 },
    'MyScript'
  );
  await expect(() =>
    execute(scope, thread, [{ script, vars: {}, stopAt: 'ask' }], true, {
      event: { text: 'yes' },
    })
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"stopped point "ask" is not a <Prompt/>, the key mapping of MyScript might have been changed"`
  );
});

it('throw if returned point is not <Call/>', async () => {
  const subScript = mockScript(
    [
      { type: 'content', getContent: () => 'how R U?' },
      { type: 'prompt', key: 'prompt#0' },
    ],
    { ask: 0, 'prompt#0': 1 },
    'ChildScript'
  );
  const script = mockScript(
    [
      { type: 'content', getContent: () => 'hi' },
      { type: 'call', script: subScript, key: 'call#0' },
    ],
    { greet: 0, 'call#0': 1 },
    'MyScript'
  );
  await expect(() =>
    execute(
      scope,
      thread,
      [
        { script, vars: {}, stopAt: 'greet' },
        { script: subScript, vars: {}, stopAt: 'prompt#0' },
      ],

      true,
      { event: { text: 'fine' } }
    )
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"returned point "greet" is not a <Call/>, the key mapping of MyScript might have been changed"`
  );
});
