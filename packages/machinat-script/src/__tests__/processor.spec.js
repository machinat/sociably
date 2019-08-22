import moxy from 'moxy';
import processor from '../processor';
import { continueRuntime } from '../runtime';
import { SCRIPT_STATE_KEY } from '../constant';

jest.mock('../runtime');

const session = moxy({
  get: async () => undefined,
  set: async () => {},
  delete: async () => true,
});

const sessionStore = moxy({
  getSession: () => session,
});

const libs = [
  { name: 'Script1' /* ,  ... */ },
  { name: 'Script2' /* ,  ... */ },
];

const frame = {
  channel: { uid: 'xxx-xxx-xxx' },
  reply: moxy(() => [{}]),
};

beforeEach(() => {
  continueRuntime.mock.reset();
  frame.reply.mock.clear();
  session.mock.reset();
  sessionStore.mock.clear();
});

const beginningState = {
  version: 'V0',
  callStack: [{ name: 'Script1', vars: { foo: 'bar' }, stoppedAt: 1 }],
};

it('resolve original frame if no script processing', async () => {
  const processEvent = processor(sessionStore, libs);
  await expect(processEvent(frame)).resolves.toEqual(frame);

  expect(sessionStore.getSession.mock).toHaveBeenCalledTimes(1);
  expect(sessionStore.getSession.mock).toHaveBeenCalledWith(frame.channel);

  expect(session.get.mock).toHaveBeenCalledTimes(1);
  expect(session.get.mock).toHaveBeenCalledWith(SCRIPT_STATE_KEY);

  expect(continueRuntime.mock).not.toHaveBeenCalled();
});

test('script not finished', async () => {
  session.get.mock.fake(async () => beginningState);
  const unfinishedResult = {
    finished: false,
    content: ['hello'],
    stack: [{ name: 'Script2', vars: { foo: 'baz' }, stoppedAt: 3 }],
  };
  continueRuntime.mock.fakeReturnValue(unfinishedResult);

  const processEvent = processor(sessionStore, libs);
  await expect(processEvent(frame)).resolves.toBe(null);

  expect(sessionStore.getSession.mock).toHaveBeenCalledTimes(1);
  expect(sessionStore.getSession.mock).toHaveBeenCalledWith(frame.channel);

  expect(session.get.mock).toHaveBeenCalledTimes(1);
  expect(session.get.mock).toHaveBeenCalledWith(SCRIPT_STATE_KEY);

  expect(continueRuntime.mock).toHaveBeenCalledTimes(1);
  expect(continueRuntime.mock).toHaveBeenCalledWith(
    libs,
    beginningState.callStack,
    frame
  );

  expect(frame.reply.mock).toHaveBeenCalledTimes(1);
  expect(frame.reply.mock).toHaveBeenCalledWith(unfinishedResult.content);

  expect(session.set.mock).toHaveBeenCalledTimes(1);
  expect(session.set.mock).toHaveBeenCalledWith(SCRIPT_STATE_KEY, {
    version: 'V0',
    callStack: unfinishedResult.stack,
  });
});

test('script finished', async () => {
  session.get.mock.fake(async () => beginningState);
  const finishedResult = {
    finished: true,
    content: ['hello'],
    stack: undefined,
  };
  continueRuntime.mock.fakeReturnValue(finishedResult);

  const processEvent = processor(sessionStore, libs);
  await expect(processEvent(frame)).resolves.toBe(null);

  expect(sessionStore.getSession.mock).toHaveBeenCalledTimes(1);
  expect(sessionStore.getSession.mock).toHaveBeenCalledWith(frame.channel);

  expect(session.get.mock).toHaveBeenCalledTimes(1);
  expect(session.get.mock).toHaveBeenCalledWith(SCRIPT_STATE_KEY);

  expect(continueRuntime.mock).toHaveBeenCalledTimes(1);
  expect(continueRuntime.mock).toHaveBeenCalledWith(
    libs,
    beginningState.callStack,
    frame
  );

  expect(frame.reply.mock).toHaveBeenCalledTimes(1);
  expect(frame.reply.mock).toHaveBeenCalledWith(finishedResult.content);

  expect(session.delete.mock).toHaveBeenCalledTimes(1);
  expect(session.delete.mock).toHaveBeenCalledWith(SCRIPT_STATE_KEY);
});
