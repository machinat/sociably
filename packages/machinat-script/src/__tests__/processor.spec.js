import moxy from 'moxy';
import Machinat from '@machinat/core';
import ScriptProcessor from '../processor';
import build from '../build';
import {
  IF,
  THEN,
  ELSE,
  WHILE,
  PROMPT,
  VARS,
  LABEL,
  CALL,
  RETURN,
} from '../keyword';

const state = moxy({
  get: async () => {},
  set: async () => false,
  delete: async () => false,
});

const stateManager = moxy({
  channelState: () => state,
});

const scope = moxy({
  injectContainer(container) {
    return container('FOO_SERVICE');
  },
});

const promptSetter = moxy(({ vars }) => vars);

const AnotherScript = build(
  'AnotherScript',
  <>
    {() => 'adipiscing '}
    <PROMPT key="ask_4" set={promptSetter} />
    {() => 'elit, '}
  </>
);

const MyScript = build(
  'MyScript',
  <>
    {() => 'Lorem '}

    <LABEL key="#1" />

    {() => 'ipsum '}

    <IF condition={({ vars: { shouldReturn } }) => !shouldReturn}>
      <THEN>
        <LABEL key="#2" />

        {() => 'dolor '}

        <PROMPT key="ask_1" set={promptSetter} />

        {() => 'sit '}
      </THEN>

      <ELSE>
        <LABEL key="#3" />
        {() => 'est '}

        <PROMPT key="ask_2" set={promptSetter} />

        {() => 'laborum. '}
        <RETURN />
      </ELSE>
    </IF>

    {() => 'amet, '}

    <PROMPT key="ask_3" set={promptSetter} />

    <LABEL key="#4" />
    {() => 'consectetur '}

    <CALL key="call_1" script={AnotherScript} />

    {() => 'sed '}

    <VARS set={({ vars }) => ({ ...vars, i: 0 })} />

    <WHILE condition={({ vars: { i } }) => i < 5}>
      <VARS set={({ vars }) => ({ ...vars, i: vars.i + 1 })} />

      <PROMPT key="ask_5" set={promptSetter} />
      {() => 'do '}
    </WHILE>

    {() => 'eiusmod '}
  </>
);

const channel = { uid: '#channel' };

beforeEach(() => {
  state.mock.reset();
  stateManager.mock.reset();
  promptSetter.mock.reset();
});

describe('#init(channel)', () => {
  test('init script from begin', async () => {
    const processor = new ScriptProcessor(stateManager, scope, [
      MyScript,
      AnotherScript,
    ]);
    const runtime = await processor.init(channel, MyScript);

    expect(runtime.channel).toEqual(channel);
    expect(runtime.isFinished).toBe(false);
    expect(runtime.isPrompting).toBe(false);

    await expect(runtime.run()).resolves.toEqual({
      finished: false,
      escaped: false,
      content: ['Lorem ', 'ipsum ', 'dolor '],
      currentScript: MyScript,
      stopAt: 'ask_1',
    });

    expect(promptSetter.mock).not.toHaveBeenCalled();
    expect(runtime.isFinished).toBe(false);
    expect(runtime.isPrompting).toBe(true);

    await expect(runtime.run({ hello: 'world' })).resolves.toEqual({
      finished: false,
      escaped: false,
      content: ['sit ', 'amet, '],
      currentScript: MyScript,
      stopAt: 'ask_3',
    });

    expect(promptSetter.mock).toHaveBeenCalledTimes(1);
    expect(promptSetter.mock).toHaveBeenCalledWith(
      { channel, vars: {} },
      { hello: 'world' }
    );

    expect(stateManager.channelState.mock).toHaveBeenCalledTimes(1);
    expect(stateManager.channelState.mock).toHaveBeenCalledWith(channel);
    expect(state.get.mock).toHaveBeenCalledTimes(1);
    expect(state.get.mock.calls[0].args[0]).toMatchInlineSnapshot(
      `"$$machinat:script"`
    );
  });

  test('init script at label', async () => {
    const processor = new ScriptProcessor(stateManager, scope, [
      MyScript,
      AnotherScript,
    ]);
    const runtime = await processor.init(channel, MyScript, { goto: '#1' });

    await expect(runtime.run()).resolves.toEqual({
      finished: false,
      escaped: false,
      content: ['ipsum ', 'dolor '],
      currentScript: MyScript,
      stopAt: 'ask_1',
    });
  });

  test('init script with initial vars specified', async () => {
    const processor = new ScriptProcessor(stateManager, scope, [
      MyScript,
      AnotherScript,
    ]);
    const runtime = await processor.init(channel, MyScript, {
      vars: { shouldReturn: true },
    });

    await expect(runtime.run()).resolves.toEqual({
      finished: false,
      escaped: false,
      content: ['Lorem ', 'ipsum ', 'est '],
      currentScript: MyScript,
      stopAt: 'ask_2',
    });

    await expect(runtime.run({ hello: 'world' })).resolves.toEqual({
      finished: true,
      escaped: false,
      content: ['laborum. '],
      currentScript: null,
      stopAt: undefined,
    });

    expect(promptSetter.mock).toHaveBeenCalledTimes(1);
    expect(promptSetter.mock).toHaveBeenCalledWith(
      { channel, vars: { shouldReturn: true } },
      { hello: 'world' }
    );
  });

  it('throw if there is already runtime saved on channel', async () => {
    state.get.mock.fake(async () => ({
      version: 'V0',
      callStack: [{ name: 'MyScript', vars: { foo: 'bar' }, stopAt: '#4' }],
      timestamp: 1587205023190,
    }));

    const processor = new ScriptProcessor(stateManager, scope, [
      MyScript,
      AnotherScript,
    ]);

    await expect(
      processor.init(channel, MyScript)
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `"executing runtime existed on channel \\"#channel\\", cannot init until finished or exited"`
    );
  });
});

describe('#continue(channel)', () => {
  it('continue from prompt', async () => {
    state.get.mock.fake(async () => ({
      version: 'V0',
      callStack: [{ name: 'MyScript', vars: { foo: 'bar' }, stopAt: 'ask_3' }],
      timestamp: 1587205023190,
    }));

    const processor = new ScriptProcessor(stateManager, scope, [
      MyScript,
      AnotherScript,
    ]);
    const runtime = await processor.continue(channel);

    expect(runtime.channel).toEqual(channel);
    expect(runtime.isPrompting).toBe(true);
    expect(runtime.isFinished).toBe(false);

    await expect(runtime.run({ hello: 'world' })).resolves.toEqual({
      finished: false,
      escaped: false,
      content: ['consectetur ', 'adipiscing '],
      currentScript: AnotherScript,
      stopAt: 'ask_4',
    });

    expect(runtime.isFinished).toBe(false);
    expect(runtime.isPrompting).toBe(true);
    expect(promptSetter.mock).toHaveBeenCalledTimes(1);
    expect(promptSetter.mock).toHaveBeenCalledWith(
      { channel, vars: { foo: 'bar' } },
      { hello: 'world' }
    );

    await expect(runtime.run({ hello: 'again' })).resolves.toEqual({
      finished: false,
      escaped: false,
      content: ['elit, ', 'sed '],
      currentScript: MyScript,
      stopAt: 'ask_5',
    });

    expect(promptSetter.mock).toHaveBeenCalledTimes(2);
    expect(promptSetter.mock).toHaveBeenCalledWith(
      { channel, vars: {} },
      { hello: 'again' }
    );

    await expect(runtime.run({ hello: 'again' })).resolves.toEqual({
      finished: false,
      escaped: false,
      content: ['do '],
      currentScript: MyScript,
      stopAt: 'ask_5',
    });

    expect(promptSetter.mock).toHaveBeenCalledTimes(3);
    expect(promptSetter.mock).toHaveBeenCalledWith(
      { channel, vars: { foo: 'bar', i: 1 } },
      { hello: 'again' }
    );

    expect(stateManager.channelState.mock).toHaveBeenCalledTimes(1);
    expect(stateManager.channelState.mock).toHaveBeenCalledWith(channel);
    expect(state.get.mock).toHaveBeenCalledTimes(1);
    expect(state.get.mock.calls[0].args[0]).toMatchInlineSnapshot(
      `"$$machinat:script"`
    );
  });

  it('continue from prompt under subscript', async () => {
    state.get.mock.fake(async () => ({
      version: 'V0',
      callStack: [
        { name: 'MyScript', vars: { foo: 'bar' }, stopAt: 'call_1' },
        { name: 'AnotherScript', vars: { foo: 'baz' }, stopAt: 'ask_4' },
      ],
      timestamp: 1587205023190,
    }));

    const processor = new ScriptProcessor(stateManager, scope, [
      MyScript,
      AnotherScript,
    ]);
    const runtime = await processor.continue(channel);

    await expect(runtime.run({ hello: 'world' })).resolves.toEqual({
      finished: false,
      escaped: false,
      content: ['elit, ', 'sed '],
      currentScript: MyScript,
      stopAt: 'ask_5',
    });

    expect(promptSetter.mock).toHaveBeenCalledTimes(1);
    expect(promptSetter.mock).toHaveBeenCalledWith(
      { channel, vars: { foo: 'baz' } },
      { hello: 'world' }
    );
  });

  it('return null if no executing runtime on chanel', async () => {
    const processor = new ScriptProcessor(stateManager, scope, [
      MyScript,
      AnotherScript,
    ]);
    await expect(processor.continue(channel)).resolves.toBe(null);
  });

  it('throw if unknown script name received', async () => {
    state.get.mock.fake(async () => ({
      version: 'V0',
      callStack: [{ name: 'UnknownScript', vars: { foo: 'bar' }, stopAt: '?' }],
      timestamp: 1587205023190,
    }));
    const processor = new ScriptProcessor(stateManager, scope, [MyScript]);
    await expect(
      processor.continue(channel)
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `"\\"UnknownScript\\" not found in linked scripts"`
    );
  });
});

describe('#exit(channel)', () => {
  it('delete saved runtime state', async () => {
    state.delete.mock.fake(async () => true);
    const processor = new ScriptProcessor(stateManager, scope, [MyScript]);
    await expect(processor.exit(channel)).resolves.toBe(true);
  });

  it('return false if no saved runtime state', async () => {
    state.delete.mock.fake(async () => false);
    const processor = new ScriptProcessor(stateManager, scope, [MyScript]);
    await expect(processor.exit(channel)).resolves.toBe(false);
  });
});

describe('#save(runtime)', () => {
  test('save newly initiated runtime', async () => {
    const processor = new ScriptProcessor(stateManager, scope, [
      MyScript,
      AnotherScript,
    ]);
    const runtime = await processor.init(channel, MyScript, {
      vars: { foo: 'bar' },
    });
    await runtime.run();
    await expect(processor.save(runtime)).resolves.toBe(true);

    expect(stateManager.channelState.mock).toHaveBeenCalledWith(channel);
    expect(state.set.mock).toHaveBeenCalledTimes(1);

    expect(state.set.mock).toHaveBeenCalledWith(
      '$$machinat:script',
      expect.any(Function)
    );
    let [, updater] = state.set.mock.calls[0].args;

    let updatedState = updater(undefined);
    expect(updatedState).toMatchInlineSnapshot(
      { timestamp: expect.any(Number) },
      `
      Object {
        "callStack": Array [
          Object {
            "name": "MyScript",
            "stopAt": "ask_1",
            "vars": Object {
              "foo": "bar",
            },
          },
        ],
        "timestamp": Any<Number>,
        "version": "V0",
      }
    `
    );

    await runtime.run({ hello: 'world' });
    await expect(processor.save(runtime)).resolves.toBe(true);
    expect(state.set.mock).toHaveBeenCalledTimes(2);
    [, updater] = state.set.mock.calls[1].args;

    updatedState = updater(updatedState);
    expect(updatedState).toMatchInlineSnapshot(
      { timestamp: expect.any(Number) },
      `
      Object {
        "callStack": Array [
          Object {
            "name": "MyScript",
            "stopAt": "ask_3",
            "vars": Object {
              "foo": "bar",
            },
          },
        ],
        "timestamp": Any<Number>,
        "version": "V0",
      }
    `
    );

    await runtime.run({ hello: 'world' });
    await expect(processor.save(runtime)).resolves.toBe(true);
    expect(state.set.mock).toHaveBeenCalledTimes(3);
    [, updater] = state.set.mock.calls[2].args;

    updatedState = updater(updatedState);
    expect(updatedState).toMatchInlineSnapshot(
      { timestamp: expect.any(Number) },
      `
      Object {
        "callStack": Array [
          Object {
            "name": "MyScript",
            "stopAt": "call_1",
            "vars": Object {
              "foo": "bar",
            },
          },
          Object {
            "name": "AnotherScript",
            "stopAt": "ask_4",
            "vars": Object {},
          },
        ],
        "timestamp": Any<Number>,
        "version": "V0",
      }
    `
    );
  });

  test('save continued runtime', async () => {
    const initialState = {
      version: 'V0',
      callStack: [
        { name: 'MyScript', vars: { foo: 'bar', i: 4 }, stopAt: 'ask_5' },
      ],
      timestamp: 1587205023190,
    };
    state.get.mock.fake(async () => initialState);

    const processor = new ScriptProcessor(stateManager, scope, [
      MyScript,
      AnotherScript,
    ]);
    const runtime = await processor.continue(channel);
    await runtime.run({ hello: 'script' });
    await expect(processor.save(runtime)).resolves.toBe(true);

    expect(stateManager.channelState.mock).toHaveBeenCalledWith(channel);
    expect(state.set.mock).toHaveBeenCalledTimes(1);

    expect(state.set.mock).toHaveBeenCalledWith(
      '$$machinat:script',
      expect.any(Function)
    );

    let [, updater] = state.set.mock.calls[0].args;
    const updatedState = updater(initialState);
    expect(updatedState).toMatchInlineSnapshot(
      { timestamp: expect.any(Number) },
      `
      Object {
        "callStack": Array [
          Object {
            "name": "MyScript",
            "stopAt": "ask_5",
            "vars": Object {
              "foo": "bar",
              "i": 5,
            },
          },
        ],
        "timestamp": Any<Number>,
        "version": "V0",
      }
    `
    );

    await runtime.run({ hello: 'script' });
    await expect(processor.save(runtime)).resolves.toBe(true);

    [, updater] = state.set.mock.calls[1].args;
    expect(updater(updatedState)).toBe(undefined);
  });

  test('do nothing if newly initiated runtime is finished', async () => {
    const processor = new ScriptProcessor(stateManager, scope, [
      MyScript,
      AnotherScript,
    ]);
    const runtime = await processor.init(channel, MyScript, { goto: '#3' });

    await runtime.run();
    await runtime.run({ hello: 'script' });

    expect(runtime.isFinished).toBe(true);
    await expect(processor.save(runtime)).resolves.toBe(false);

    expect(state.set.mock).not.toHaveBeenCalled();
  });

  test('throw if newly initiated runtime save while runtime state existing', async () => {
    const processor = new ScriptProcessor(stateManager, scope, [
      MyScript,
      AnotherScript,
    ]);
    const runtime = await processor.init(channel, MyScript, { goto: '#3' });

    state.set.mock.fake(async (key, updater) =>
      updater({
        version: 'V0',
        callStack: [
          { name: 'MyScript', vars: { foo: 'bar', i: 4 }, stopAt: 'ask_5' },
        ],
        timestamp: 1587205023190,
      })
    );
    await runtime.run();

    await expect(processor.save(runtime)).rejects.toMatchInlineSnapshot(
      `[Error: runtime state have changed while execution, there are maybe mutiple runtimes of the same channel executing at the same time]`
    );
  });

  test('throw if continued runtime save while no runtime state existing', async () => {
    state.get.mock.fake(async () => ({
      version: 'V0',
      callStack: [
        { name: 'MyScript', vars: { foo: 'bar', i: 2 }, stopAt: 'ask_5' },
      ],
      timestamp: 1587205023190,
    }));

    const processor = new ScriptProcessor(stateManager, scope, [
      MyScript,
      AnotherScript,
    ]);
    const runtime = await processor.continue(channel);

    state.set.mock.fake(async (key, updater) => updater(undefined));
    await runtime.run();

    await expect(processor.save(runtime)).rejects.toMatchInlineSnapshot(
      `[Error: runtime state have changed while execution, there are maybe mutiple runtimes of the same channel executing at the same time]`
    );
  });

  test('throw if continued runtime save while original saveTimestamp no matching', async () => {
    state.get.mock.fake(async () => ({
      version: 'V0',
      callStack: [
        { name: 'MyScript', vars: { foo: 'bar', i: 3 }, stopAt: 'ask_5' },
      ],
      timestamp: 1587205023190,
    }));

    const processor = new ScriptProcessor(stateManager, scope, [
      MyScript,
      AnotherScript,
    ]);
    const runtime = await processor.continue(channel);

    state.set.mock.fake(async (key, updater) =>
      updater({
        version: 'V0',
        callStack: [
          { name: 'MyScript', vars: { foo: 'bar', i: 4 }, stopAt: 'ask_5' },
        ],
        timestamp: 1587205099999,
      })
    );
    await runtime.run({ hello: 'script' });

    await expect(processor.save(runtime)).rejects.toMatchInlineSnapshot(
      `[Error: runtime state have changed while execution, there are maybe mutiple runtimes of the same channel executing at the same time]`
    );
  });
});
