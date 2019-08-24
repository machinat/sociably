import moxy from 'moxy';
import { toArray } from 'machinat-utility';
import { StateService } from 'machinat-session';
import { processInterceptor, initProcessComponent } from '../processor';
import runner from '../runner';
import { SCRIPT_STATE_KEY } from '../constant';

jest.mock('../runner', () =>
  jest.requireActual('moxy').default(() => ({
    finished: true,
    stack: undefined,
    constent: ['bye'],
  }))
);

beforeEach(() => {
  runner.mock.reset();
});

describe('processInterceptor', () => {
  const session = moxy({
    get: async () => undefined,
    set: async () => {},
    delete: async () => true,
  });

  const sessionStore = moxy({
    getSession: () => session,
  });

  const Script1 = { name: 'Script1' /* ... */ };
  const Script2 = { name: 'Script2' /* ... */ };

  const frame = {
    channel: { uid: 'xxx-xxx-xxx' },
    reply: moxy(() => [{}]),
  };

  beforeEach(() => {
    frame.reply.mock.clear();
    session.mock.reset();
    sessionStore.mock.clear();
  });

  it('resolve original frame if no script processing', async () => {
    const intercept = processInterceptor(sessionStore, [Script1, Script2]);

    await expect(intercept(frame)).resolves.toEqual(frame);

    expect(sessionStore.getSession.mock).toHaveBeenCalledTimes(1);
    expect(sessionStore.getSession.mock).toHaveBeenCalledWith(frame.channel);

    expect(session.get.mock).toHaveBeenCalledTimes(1);
    expect(session.get.mock).toHaveBeenCalledWith(SCRIPT_STATE_KEY);

    expect(runner.mock).not.toHaveBeenCalled();
  });

  test('script not finished', async () => {
    const beginningState = {
      version: 'V0',
      callStack: [
        { name: 'Script1', vars: { foo: 'bar' }, stoppedAt: 'somewhere' },
      ],
    };
    session.get.mock.fake(async () => beginningState);

    const runningResult = {
      finished: false,
      content: ['hello'],
      stack: [
        { script: Script1, vars: { foo: 'bar' }, at: 'somewhere' },
        { script: Script2, vars: { foo: 'baz' }, at: 'otherwhere' },
      ],
    };
    runner.mock.fakeReturnValue(runningResult);

    const intercept = processInterceptor(sessionStore, [Script1, Script2]);
    await expect(intercept(frame)).resolves.toBe(null);

    expect(sessionStore.getSession.mock).toHaveBeenCalledTimes(1);
    expect(sessionStore.getSession.mock).toHaveBeenCalledWith(frame.channel);

    expect(session.get.mock).toHaveBeenCalledTimes(1);
    expect(session.get.mock).toHaveBeenCalledWith(SCRIPT_STATE_KEY);

    expect(runner.mock).toHaveBeenCalledTimes(1);
    expect(runner.mock).toHaveBeenCalledWith(
      [{ script: Script1, vars: { foo: 'bar' }, at: 'somewhere' }],
      frame
    );

    expect(frame.reply.mock).toHaveBeenCalledTimes(1);
    expect(frame.reply.mock).toHaveBeenCalledWith(runningResult.content);

    expect(session.set.mock).toHaveBeenCalledTimes(1);
    expect(session.set.mock).toHaveBeenCalledWith(SCRIPT_STATE_KEY, {
      version: 'V0',
      callStack: [
        { name: 'Script1', vars: { foo: 'bar' }, stoppedAt: 'somewhere' },
        { name: 'Script2', vars: { foo: 'baz' }, stoppedAt: 'otherwhere' },
      ],
    });
  });

  test('script finished', async () => {
    const beginningState = {
      version: 'V0',
      callStack: [
        { name: 'Script1', vars: { foo: 'bar' }, stoppedAt: 'somewhere' },
      ],
    };
    session.get.mock.fake(async () => beginningState);

    const runningResult = {
      finished: true,
      content: ['hello'],
      stack: undefined,
    };
    runner.mock.fakeReturnValue(runningResult);

    const intercept = processInterceptor(sessionStore, [Script1, Script2]);
    await expect(intercept(frame)).resolves.toBe(null);

    expect(sessionStore.getSession.mock).toHaveBeenCalledTimes(1);
    expect(sessionStore.getSession.mock).toHaveBeenCalledWith(frame.channel);

    expect(session.get.mock).toHaveBeenCalledTimes(1);
    expect(session.get.mock).toHaveBeenCalledWith(SCRIPT_STATE_KEY);

    expect(runner.mock).toHaveBeenCalledTimes(1);
    expect(runner.mock).toHaveBeenCalledWith(
      [{ script: Script1, vars: { foo: 'bar' }, at: 'somewhere' }],
      frame
    );

    expect(frame.reply.mock).toHaveBeenCalledTimes(1);
    expect(frame.reply.mock).toHaveBeenCalledWith(runningResult.content);

    expect(session.delete.mock).toHaveBeenCalledTimes(1);
    expect(session.delete.mock).toHaveBeenCalledWith(SCRIPT_STATE_KEY);
  });

  it('throw if script name duplicated', () => {
    expect(() =>
      processInterceptor(sessionStore, [Script1, Script2, Script1])
    ).toThrowErrorMatchingInlineSnapshot(
      `"script name \\"Script1\\" duplicated"`
    );
  });

  it('throw if script name not found', async () => {
    const intercept = processInterceptor(sessionStore, [Script1, Script2]);
    session.get.mock.fake(async () => ({
      version: 'V0',
      callStack: [
        { name: 'Script1', vars: { foo: 'bar' }, stoppedAt: 'somewhere' },
        { name: 'ScriptUnknown', vars: { foo: 'bar' }, stoppedAt: 'somewhere' },
        { name: 'Script2', vars: { foo: 'bar' }, stoppedAt: 'somewhere' },
      ],
    }));

    await expect(intercept(frame)).rejects.toThrowErrorMatchingInlineSnapshot(
      `"\\"ScriptUnknown\\" not found in linked scripts"`
    );
  });
});

describe('initProcessComponent', () => {
  const Script = { name: 'Script' /* ... */ };

  it('render to script content if finished', () => {
    const InitComponent = initProcessComponent(Script);

    runner.mock.fakeReturnValue({
      finished: true,
      content: ['hello'],
      stack: undefined,
    });

    const rendered = InitComponent({ vars: { foo: 'bar' }, goto: 'baz' });

    expect(runner.mock).toHaveBeenCalledTimes(1);
    expect(runner.mock).toHaveBeenCalledWith([
      { script: Script, vars: { foo: 'bar' }, at: 'baz' },
    ]);

    expect(rendered).toEqual(['hello']);
  });

  it('render content and update state if not finished', () => {
    const InitComponent = initProcessComponent(Script);
    runner.mock.fakeReturnValue({
      finished: false,
      content: ['hello'],
      stack: [{ script: Script, vars: { foo: 'baz' }, at: 'over_rainbow' }],
    });

    const rendered = InitComponent({ vars: { foo: 'bar' }, goto: 'somewhere' });

    expect(runner.mock).toHaveBeenCalledTimes(1);
    expect(runner.mock).toHaveBeenCalledWith([
      { script: Script, vars: { foo: 'bar' }, at: 'somewhere' },
    ]);

    const content = toArray(rendered);
    expect(content.length).toBe(1);
    expect(content[0].type).toBe(StateService.Consumer);

    const consume = content[0].props.children;
    const updateState = moxy();

    expect(consume([{}, updateState])).toEqual(['hello']);
    expect(updateState.mock).toHaveBeenCalledTimes(1);

    const updator = updateState.mock.calls[0].args[0];

    // write state if no script processing
    expect(updator(undefined)).toEqual({
      version: 'V0',
      callStack: [
        { name: 'Script', vars: { foo: 'baz' }, stoppedAt: 'over_rainbow' },
      ],
    });

    // append stack if already processing
    expect(
      updator({
        version: 'V0',
        callStack: [
          { name: 'Script2', vars: { foo: 'bar' }, stoppedAt: 'somewhere' },
        ],
      })
    ).toEqual({
      callStack: [
        { name: 'Script2', vars: { foo: 'bar' }, stoppedAt: 'somewhere' },
        { name: 'Script', vars: { foo: 'baz' }, stoppedAt: 'over_rainbow' },
      ],
    });
  });
});
