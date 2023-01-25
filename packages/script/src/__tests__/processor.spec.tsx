import moxy from '@moxyjs/moxy';
import Sociably from '@sociably/core';
import { ServiceScope } from '@sociably/core/service';
import { traverse as traverseMessage } from '@sociably/core/iterator';
import { InMemoryStateController } from '@sociably/dev-tools/InMemoryState';
import { ScriptProcessor } from '../processor';
import build from '../build';
import { SCRIPT_STATE_KEY } from '../constant';
import {
  IF,
  ELSE,
  WHILE,
  PROMPT,
  EFFECT,
  LABEL,
  CALL,
  RETURN,
} from '../keyword';

const scope = moxy<ServiceScope>({
  injectContainer(container) {
    return container('FOO_SERVICE');
  },
} as never);

const promptSetFn = moxy(({ vars }) => vars);
const effectYieldFn = moxy((_, prev = { n: 0 }) => ({ n: prev.n + 1 }));

const AnotherScript = moxy(
  build<{}, {}, {}, void, void, { hello: string }>(
    {
      name: 'AnotherScript',
      initVars: (input) => input,
      meta: { hello: 'here' },
    },
    <>
      <EFFECT yield={effectYieldFn} />
      {() => 'adipiscing '}

      <PROMPT key="ask_4" set={promptSetFn} />
      {() => 'elit, '}
      <EFFECT yield={effectYieldFn} />
    </>
  )
);

const MyScript = moxy(
  build<{}, {}, {}, void, void, { hello: string }>(
    { name: 'MyScript', initVars: (input) => input, meta: { hello: 'there' } },
    <>
      {() => 'Lorem '}
      <EFFECT yield={effectYieldFn} />

      <LABEL key="#1" />
      {() => 'ipsum '}
      <IF condition={({ vars: { foo } }) => !foo}>
        <LABEL key="#2" />
        {() => 'dolor '}
        <EFFECT yield={effectYieldFn} />

        <PROMPT key="ask_1" set={promptSetFn} />
        {() => 'sit '}
        <EFFECT yield={effectYieldFn} />
      </IF>
      <ELSE>
        <LABEL key="#3" />
        {() => 'est '}

        <PROMPT key="ask_2" set={promptSetFn} />
        {() => 'laborum. '}
        <RETURN value={({ vars: { foo } }) => ({ foo })} />
      </ELSE>
      {() => 'amet, '}

      <PROMPT key="ask_3" set={promptSetFn} />
      <EFFECT yield={effectYieldFn} />

      <LABEL key="#4" />
      {() => 'consectetur '}

      <CALL key="call_1" script={AnotherScript} />
      {() => 'sed '}
      <EFFECT set={({ vars }) => ({ ...vars, i: 0 })} yield={effectYieldFn} />
      <WHILE condition={({ vars: { i } }) => i < 5}>
        <EFFECT
          set={({ vars }) => ({ ...vars, i: vars.i + 1 })}
          yield={effectYieldFn}
        />

        <PROMPT key="ask_5" set={promptSetFn} />
        {() => 'do '}
      </WHILE>
      {() => 'eiusmod '}
      <RETURN value={({ vars: { foo } }) => ({ foo, done: true })} />
    </>
  )
);

const channel = { platform: 'test', uid: '#channel' };

beforeEach(() => {
  MyScript.mock.clear();
  AnotherScript.mock.clear();
  promptSetFn.mock.reset();
  effectYieldFn.mock.reset();
});

describe('.start(channel, Script)', () => {
  test('start script from begin', async () => {
    const stateController = new InMemoryStateController();
    const processor = new ScriptProcessor(stateController, scope, [
      MyScript,
      AnotherScript,
    ]);
    const runtime = await processor.start(channel, MyScript);

    expect(promptSetFn.mock).not.toHaveBeenCalled();
    expect(runtime.channel).toEqual(channel);
    expect(runtime.isFinished).toBe(false);
    expect(runtime.isBeginning).toBe(false);
    expect(runtime.requireSaving).toBe(true);
    expect(runtime.returnValue).toBe(undefined);
    expect(runtime.yieldValue).toEqual({ n: 2 });
    expect(runtime.rootScript).toBe(MyScript);
    expect(effectYieldFn.mock).toHaveBeenCalledTimes(2);

    expect(runtime.callStack).toEqual([
      { script: MyScript, stopAt: 'ask_1', vars: {} },
    ]);

    expect(MyScript.initVars.mock).toHaveBeenCalledTimes(1);
    expect(MyScript.initVars.mock).toHaveBeenCalledWith({});

    const message = runtime.output();
    expect(message).toMatchInlineSnapshot(`
      <Sociably.Fragment>
        Lorem 
        ipsum 
        dolor 
        <Sociably.Thunk
          effect={[Function]}
        />
      </Sociably.Fragment>
    `);

    let thunk;
    traverseMessage(message, '$', {}, (node) => {
      if (typeof node === 'object' && node.type === Sociably.Thunk) {
        thunk = node;
      }
    });

    await thunk.props.effect();

    expect(runtime.requireSaving).toBe(false);
    await expect(
      stateController.channelState(channel).get(SCRIPT_STATE_KEY)
    ).resolves.toMatchInlineSnapshot(
      { timestamp: expect.any(Number) } as any,
      `
            Object {
              "callStack": Array [
                Object {
                  "name": "MyScript",
                  "stopAt": "ask_1",
                  "vars": Object {},
                },
              ],
              "timestamp": Any<Number>,
              "version": "0",
            }
          `
    );

    expect(promptSetFn.mock).not.toHaveBeenCalled();
  });

  test('start script at label', async () => {
    const stateController = new InMemoryStateController();
    const processor = new ScriptProcessor(stateController, scope, [
      MyScript,
      AnotherScript,
    ]);
    const runtime = await processor.start(channel, MyScript, {
      goto: '#3',
    });

    expect(runtime.isFinished).toBe(false);
    expect(runtime.isBeginning).toBe(false);
    expect(runtime.requireSaving).toBe(true);
    expect(runtime.returnValue).toBe(undefined);
    expect(runtime.yieldValue).toEqual(undefined);
    expect(runtime.rootScript).toBe(MyScript);
    expect(effectYieldFn.mock).not.toHaveBeenCalled();

    expect(runtime.callStack).toEqual([
      { script: MyScript, stopAt: 'ask_2', vars: {} },
    ]);

    expect(MyScript.initVars.mock).toHaveBeenCalledTimes(1);
    expect(MyScript.initVars.mock).toHaveBeenCalledWith({});

    const message = runtime.output();
    expect(message).toMatchInlineSnapshot(`
      <Sociably.Fragment>
        est 
        <Sociably.Thunk
          effect={[Function]}
        />
      </Sociably.Fragment>
    `);

    let thunk;
    traverseMessage(message, '$', {}, (node) => {
      if (typeof node === 'object' && node.type === Sociably.Thunk) {
        thunk = node;
      }
    });

    await thunk.props.effect();
    await expect(
      stateController.channelState(channel).get(SCRIPT_STATE_KEY)
    ).resolves.toMatchInlineSnapshot(
      { timestamp: expect.any(Number) } as any,
      `
            Object {
              "callStack": Array [
                Object {
                  "name": "MyScript",
                  "stopAt": "ask_2",
                  "vars": Object {},
                },
              ],
              "timestamp": Any<Number>,
              "version": "0",
            }
          `
    );
  });

  test('init script with params specified', async () => {
    const stateController = new InMemoryStateController();
    const processor = new ScriptProcessor(stateController, scope, [
      MyScript,
      AnotherScript,
    ]);
    const runtime = await processor.start(channel, MyScript, {
      params: { foo: 'bar' },
    });

    expect(runtime.channel).toEqual(channel);
    expect(runtime.isFinished).toBe(false);
    expect(runtime.isBeginning).toBe(false);
    expect(runtime.requireSaving).toBe(true);
    expect(runtime.returnValue).toBe(undefined);
    expect(runtime.yieldValue).toEqual({ n: 1 });
    expect(runtime.rootScript).toBe(MyScript);
    expect(effectYieldFn.mock).toHaveBeenCalledTimes(1);

    expect(runtime.callStack).toEqual([
      { script: MyScript, stopAt: 'ask_2', vars: { foo: 'bar' } },
    ]);

    expect(MyScript.initVars.mock).toHaveBeenCalledTimes(1);
    expect(MyScript.initVars.mock).toHaveBeenCalledWith({ foo: 'bar' });

    const message = runtime.output();
    expect(message).toMatchInlineSnapshot(`
      <Sociably.Fragment>
        Lorem 
        ipsum 
        est 
        <Sociably.Thunk
          effect={[Function]}
        />
      </Sociably.Fragment>
    `);

    let thunk;
    traverseMessage(message, '$', {}, (node) => {
      if (typeof node === 'object' && node.type === Sociably.Thunk) {
        thunk = node;
      }
    });

    await thunk.props.effect();
    await expect(
      stateController.channelState(channel).get(SCRIPT_STATE_KEY)
    ).resolves.toMatchInlineSnapshot(
      { timestamp: expect.any(Number) } as any,
      `
            Object {
              "callStack": Array [
                Object {
                  "name": "MyScript",
                  "stopAt": "ask_2",
                  "vars": Object {
                    "foo": "bar",
                  },
                },
              ],
              "timestamp": Any<Number>,
              "version": "0",
            }
          `
    );
  });

  it('throw if script is not registered', async () => {
    const stateController = new InMemoryStateController();
    const processor = new ScriptProcessor(stateController, scope, [MyScript]);

    await expect(
      processor.start(channel, AnotherScript)
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `"script AnotherScript is not registered as libs"`
    );
  });

  it('throw if there is already script processing in the channel', async () => {
    const stateController = new InMemoryStateController();
    await stateController.channelState(channel).set(SCRIPT_STATE_KEY, {
      version: '0',
      callStack: [{ name: 'MyScript', vars: { foo: 'bar' }, stopAt: 'ask_3' }],
      timestamp: 1587205023190,
    });

    const processor = new ScriptProcessor(stateController, scope, [MyScript]);

    await expect(
      processor.start(channel, MyScript)
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `"script [MyScript] is already running on channel [#channel], exit the current runtime before start new one"`
    );
  });
});

describe('.continue(channel, input)', () => {
  it('continue from prompt point', async () => {
    const stateController = new InMemoryStateController();
    await stateController.channelState(channel).set(SCRIPT_STATE_KEY, {
      version: '0',
      callStack: [{ name: 'MyScript', vars: { foo: 'bar' }, stopAt: 'ask_3' }],
      timestamp: 1587205023190,
    });

    const processor = new ScriptProcessor(stateController, scope, [
      MyScript,
      AnotherScript,
    ]);
    const runtime = (await processor.continue(channel, { hello: 'world' }))!;

    expect(MyScript.initVars.mock).not.toHaveBeenCalled();
    expect(AnotherScript.initVars.mock).toHaveBeenCalledTimes(1);

    expect(runtime.channel).toEqual(channel);
    expect(runtime.isBeginning).toBe(false);
    expect(runtime.isFinished).toBe(false);
    expect(runtime.requireSaving).toBe(true);
    expect(runtime.returnValue).toBe(undefined);
    expect(runtime.yieldValue).toEqual({ n: 2 });
    expect(runtime.rootScript).toBe(MyScript);
    expect(effectYieldFn.mock).toHaveBeenCalledTimes(2);

    const message = runtime.output();
    expect(message).toMatchInlineSnapshot(`
      <Sociably.Fragment>
        consectetur 
        adipiscing 
        <Sociably.Thunk
          effect={[Function]}
        />
      </Sociably.Fragment>
    `);

    let thunk;
    traverseMessage(message, '$', {}, (node) => {
      if (typeof node === 'object' && node.type === Sociably.Thunk) {
        thunk = node;
      }
    });

    await thunk.props.effect();
    await expect(
      stateController.channelState(channel).get(SCRIPT_STATE_KEY)
    ).resolves.toMatchInlineSnapshot(
      { timestamp: expect.any(Number) } as any,
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
              "version": "0",
            }
          `
    );

    expect(promptSetFn.mock).toHaveBeenCalledTimes(1);
    expect(promptSetFn.mock).toHaveBeenCalledWith(
      {
        platform: 'test',
        channel,
        vars: { foo: 'bar' },
        meta: { hello: 'there' },
      },
      { hello: 'world' }
    );
  });

  it('continue under subscript', async () => {
    const stateController = new InMemoryStateController();
    await stateController.channelState(channel).set(SCRIPT_STATE_KEY, {
      version: '0',
      callStack: [
        { name: 'MyScript', vars: { foo: 'bar' }, stopAt: 'call_1' },
        { name: 'AnotherScript', vars: { foo: 'baz' }, stopAt: 'ask_4' },
      ],
      timestamp: 1587205023190,
    });

    const processor = new ScriptProcessor(stateController, scope, [
      MyScript,
      AnotherScript,
    ]);
    const runtime = (await processor.continue(channel, { hello: 'world' }))!;

    expect(MyScript.initVars.mock).not.toHaveBeenCalled();
    expect(AnotherScript.initVars.mock).not.toHaveBeenCalled();

    expect(runtime.channel).toEqual(channel);
    expect(runtime.isBeginning).toBe(false);
    expect(runtime.isFinished).toBe(false);
    expect(runtime.requireSaving).toBe(true);
    expect(runtime.returnValue).toBe(undefined);
    expect(runtime.yieldValue).toEqual({ n: 3 });
    expect(runtime.rootScript).toBe(MyScript);
    expect(effectYieldFn.mock).toHaveBeenCalledTimes(3);

    const message = runtime.output();
    expect(message).toMatchInlineSnapshot(`
      <Sociably.Fragment>
        elit, 
        sed 
        <Sociably.Thunk
          effect={[Function]}
        />
      </Sociably.Fragment>
    `);

    let thunk;
    traverseMessage(message, '$', {}, (node) => {
      if (typeof node === 'object' && node.type === Sociably.Thunk) {
        thunk = node;
      }
    });

    await thunk.props.effect();
    await expect(
      stateController.channelState(channel).get(SCRIPT_STATE_KEY)
    ).resolves.toMatchInlineSnapshot(
      { timestamp: expect.any(Number) } as any,
      `
            Object {
              "callStack": Array [
                Object {
                  "name": "MyScript",
                  "stopAt": "ask_5",
                  "vars": Object {
                    "foo": "bar",
                    "i": 1,
                  },
                },
              ],
              "timestamp": Any<Number>,
              "version": "0",
            }
          `
    );

    expect(promptSetFn.mock).toHaveBeenCalledTimes(1);
    expect(promptSetFn.mock).toHaveBeenCalledWith(
      {
        platform: 'test',
        channel,
        vars: { foo: 'baz' },
        meta: { hello: 'here' },
      },
      { hello: 'world' }
    );
  });

  it('return null if no executing runtime on chanel', async () => {
    const stateController = new InMemoryStateController();
    const processor = new ScriptProcessor(stateController, scope, [
      MyScript,
      AnotherScript,
    ]);
    await expect(processor.continue(channel, { hello: 'world' })).resolves.toBe(
      null
    );
  });

  it('throw if unknown script name received', async () => {
    const stateController = new InMemoryStateController();
    await stateController.channelState(channel).set(SCRIPT_STATE_KEY, {
      version: '0',
      callStack: [{ name: 'UnknownScript', vars: { foo: 'bar' }, stopAt: '?' }],
      timestamp: 1587205023190,
    });

    const processor = new ScriptProcessor(stateController, scope, [MyScript]);
    await expect(
      processor.continue(channel, { hello: 'world' })
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `"script UnknownScript is not registered, the linked libs might have been changed"`
    );
  });
});

describe('.getRuntime(channel)', () => {
  test('manually call runtime.run()', async () => {
    const stateController = new InMemoryStateController();
    await stateController.channelState(channel).set(SCRIPT_STATE_KEY, {
      version: '0',
      callStack: [{ name: 'MyScript', vars: { foo: 'bar' }, stopAt: 'ask_3' }],
      timestamp: 1587205023190,
    });

    const processor = new ScriptProcessor(stateController, scope, [
      MyScript,
      AnotherScript,
    ]);
    const runtime = (await processor.getRuntime(channel))!;

    expect(runtime.channel).toEqual(channel);
    expect(runtime.isBeginning).toBe(false);
    expect(runtime.isFinished).toBe(false);
    expect(runtime.requireSaving).toBe(false);
    expect(runtime.rootScript).toBe(MyScript);

    await expect(runtime.run({ hello: 'world' })).resolves.toEqual({
      finished: false,
      returnValue: undefined,
      yieldValue: { n: 2 },
      contents: ['consectetur ', 'adipiscing '],
    });

    expect(runtime.isFinished).toBe(false);
    expect(runtime.isBeginning).toBe(false);
    expect(runtime.requireSaving).toBe(true);
    expect(promptSetFn.mock).toHaveBeenCalledTimes(1);
    expect(promptSetFn.mock).toHaveBeenCalledWith(
      {
        platform: 'test',
        channel,
        vars: { foo: 'bar' },
        meta: { hello: 'there' },
      },
      { hello: 'world' }
    );

    await expect(runtime.run({ hello: 'again' })).resolves.toEqual({
      finished: false,
      returnValue: undefined,
      contents: ['elit, ', 'sed '],
      yieldValue: { n: 3 },
    });

    expect(promptSetFn.mock).toHaveBeenCalledTimes(2);
    expect(promptSetFn.mock).toHaveBeenCalledWith(
      {
        platform: 'test',
        channel,
        vars: {},
        meta: { hello: 'here' },
      },
      { hello: 'again' }
    );

    for (let i = 0; i < 4; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await expect(runtime.run({ hello: 'again' })).resolves.toEqual({
        finished: false,
        returnValue: undefined,
        contents: ['do '],
        yieldValue: { n: 1 },
      });

      expect(promptSetFn.mock).toHaveBeenCalledTimes(3 + i);
      expect(promptSetFn.mock).toHaveBeenCalledWith(
        {
          platform: 'test',
          channel,
          vars: { foo: 'bar', i: 1 + i },
          meta: { hello: 'there' },
        },
        { hello: 'again' }
      );
    }

    await expect(runtime.run({ hello: 'again' })).resolves.toEqual({
      finished: true,
      returnValue: { foo: 'bar', done: true },
      contents: ['do ', 'eiusmod '],
    });
  });

  it('return null if no executing runtime on chanel', async () => {
    const stateController = new InMemoryStateController();
    const processor = new ScriptProcessor(stateController, scope, [
      MyScript,
      AnotherScript,
    ]);
    await expect(processor.getRuntime(channel)).resolves.toBe(null);
  });

  it('throw if unknown script name received', async () => {
    const stateController = new InMemoryStateController();
    await stateController.channelState(channel).set(SCRIPT_STATE_KEY, {
      version: '0',
      callStack: [{ name: 'UnknownScript', vars: { foo: 'bar' }, stopAt: '?' }],
      timestamp: 1587205023190,
    });

    const processor = new ScriptProcessor(stateController, scope, [MyScript]);
    await expect(
      processor.getRuntime(channel)
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `"script UnknownScript is not registered, the linked libs might have been changed"`
    );
  });
});

describe('Runtime.exit(channel)', () => {
  it('delete saved runtime state', async () => {
    const stateController = new InMemoryStateController();
    await stateController.channelState(channel).set(SCRIPT_STATE_KEY, {
      version: '0',
      callStack: [{ name: 'MyScript', vars: { foo: 'bar' }, stopAt: 'ask_3' }],
      timestamp: 1587205023190,
    });

    const processor = new ScriptProcessor(stateController, scope, [MyScript]);
    const runtime = (await processor.getRuntime(channel))!;

    await expect(runtime.exit()).resolves.toBe(true);

    await expect(
      stateController.channelState(channel).get(SCRIPT_STATE_KEY)
    ).resolves.toBe(undefined);
  });

  it('return false if no saved runtime state', async () => {
    const stateController = new InMemoryStateController();
    const processor = new ScriptProcessor(stateController, scope, [MyScript]);

    const runtime = await processor.start(channel, MyScript);
    await expect(runtime.exit()).resolves.toBe(false);

    await expect(
      stateController.channelState(channel).get(SCRIPT_STATE_KEY)
    ).resolves.toBe(undefined);
  });
});

describe('Runtime.save(runtime)', () => {
  test('save newly initiated runtime', async () => {
    const stateController = new InMemoryStateController();
    const processor = new ScriptProcessor(stateController, scope, [
      MyScript,
      AnotherScript,
    ]);

    const runtime = await processor.start(channel, MyScript, {
      params: { foo: 'bar' },
    });
    await expect(runtime.save()).resolves.toBe(true);

    await expect(
      stateController.channelState(channel).get(SCRIPT_STATE_KEY)
    ).resolves.toEqual({
      callStack: [{ name: 'MyScript', stopAt: 'ask_2', vars: { foo: 'bar' } }],
      timestamp: expect.any(Number),
      version: '0',
    });
  });

  test('save continued runtime', async () => {
    const stateController = new InMemoryStateController();
    const processor = new ScriptProcessor(stateController, scope, [
      MyScript,
      AnotherScript,
    ]);

    stateController.channelState(channel).set(SCRIPT_STATE_KEY, {
      callStack: [{ name: 'MyScript', stopAt: 'ask_3', vars: { foo: 'bar' } }],
      timestamp: expect.any(Number),
      version: '0',
    });

    const runtime = (await processor.getRuntime(channel))!;
    await runtime.run({ hello: 'world' });
    await expect(runtime.save()).resolves.toBe(true);

    await expect(
      stateController.channelState(channel).get(SCRIPT_STATE_KEY)
    ).resolves.toEqual({
      callStack: [
        { name: 'MyScript', stopAt: 'call_1', vars: { foo: 'bar' } },
        { name: 'AnotherScript', stopAt: 'ask_4', vars: {} },
      ],
      timestamp: expect.any(Number),
      version: '0',
    });
  });

  test('do nothing if newly initiated runtime is finished', async () => {
    const stateController = new InMemoryStateController();
    const processor = new ScriptProcessor(stateController, scope, [
      MyScript,
      AnotherScript,
    ]);
    const runtime = await processor.start(channel, MyScript, {
      goto: '#3',
    });

    await runtime.run();
    await runtime.run({ hello: 'script' });

    expect(runtime.isFinished).toBe(true);
    await expect(runtime.save()).resolves.toBe(false);

    await expect(
      stateController.channelState(channel).get(SCRIPT_STATE_KEY)
    ).resolves.toBe(undefined);
  });

  test('throw if newly initiated runtime save while runtime state existing', async () => {
    const stateController = new InMemoryStateController();
    const processor = new ScriptProcessor(stateController, scope, [
      MyScript,
      AnotherScript,
    ]);

    const runtime = await processor.start(channel, MyScript, {
      goto: '#3',
    });

    stateController.channelState(channel).set(SCRIPT_STATE_KEY, {
      version: '0',
      callStack: [
        { name: 'MyScript', vars: { foo: 'bar', i: 4 }, stopAt: 'ask_5' },
      ],
      timestamp: 1587205023190,
    });

    await expect(runtime.save()).rejects.toMatchInlineSnapshot(
      `[Error: runtime state have changed while execution, there are maybe mutiple runtimes of the same channel executing at the same time]`
    );
  });

  test('throw if continued runtime save while no runtime state existing', async () => {
    const stateController = new InMemoryStateController();
    stateController.channelState(channel).set(SCRIPT_STATE_KEY, {
      version: '0',
      callStack: [
        { name: 'MyScript', vars: { foo: 'bar', i: 2 }, stopAt: 'ask_5' },
      ],
      timestamp: 1587205023190,
    });

    const processor = new ScriptProcessor(stateController, scope, [
      MyScript,
      AnotherScript,
    ]);
    const runtime = (await processor.getRuntime(channel))!;

    stateController.channelState(channel).delete(SCRIPT_STATE_KEY);
    await runtime.run();

    await expect(runtime.save()).rejects.toMatchInlineSnapshot(
      `[Error: runtime state have changed while execution, there are maybe mutiple runtimes of the same channel executing at the same time]`
    );
  });

  test('throw if saveTimestamp not match', async () => {
    const stateController = new InMemoryStateController();
    stateController.channelState(channel).set(SCRIPT_STATE_KEY, {
      version: '0',
      callStack: [
        { name: 'MyScript', vars: { foo: 'bar', i: 2 }, stopAt: 'ask_5' },
      ],
      timestamp: 1587205023190,
    });

    const processor = new ScriptProcessor(stateController, scope, [
      MyScript,
      AnotherScript,
    ]);
    const runtime = (await processor.getRuntime(channel))!;

    stateController.channelState(channel).set(SCRIPT_STATE_KEY, {
      version: '0',
      callStack: [
        { name: 'MyScript', vars: { foo: 'bar', i: 4 }, stopAt: 'ask_5' },
      ],
      timestamp: 1587205099999,
    });
    await runtime.run({ hello: 'script' });

    await expect(runtime.save()).rejects.toMatchInlineSnapshot(
      `[Error: runtime state have changed while execution, there are maybe mutiple runtimes of the same channel executing at the same time]`
    );
  });
});
