import moxy from 'moxy';
import StateService from '../StateService';

const session = moxy({
  get: async () => ({ foo: 'bar' }),
  set: async () => {},
  update: async () => {},
});

const thunk = moxy();

beforeEach(() => {
  session.mock.clear();
  thunk.mock.clear();
});

it('fetch state from session', async () => {
  await expect(
    StateService._serve({ session })({ key: 'some_key' }, thunk)
  ).resolves.toEqual([{ foo: 'bar' }, expect.any(Function)]);

  expect(session.get.mock).toHaveBeenCalledTimes(1);
  expect(session.get.mock).toHaveBeenCalledWith('some_key');
});

it('provide setState fn for updating state', async () => {
  const [, setState] = await StateService._serve({ session })(
    { key: 'some_key' },
    thunk
  );

  expect(thunk.mock).not.toHaveBeenCalled();
  expect(session.update.mock).not.toHaveBeenCalled();

  expect(setState({ foo: 'baz' })).toBe(undefined);

  expect(thunk.mock).toHaveBeenCalledTimes(1);
  expect(thunk.mock).toHaveBeenCalledWith(expect.any(Function));
  const thunked = thunk.mock.calls[0].args[0];

  expect(thunked()).resolves.toBe(undefined);
  expect(session.set.mock).toHaveBeenCalledTimes(1);
  expect(session.set.mock).toHaveBeenCalledWith('some_key', { foo: 'baz' });
});

it('can setState with updator fn', async () => {
  const [, setState] = await StateService._serve({ session })(
    { key: 'some_key' },
    thunk
  );

  expect(thunk.mock).not.toHaveBeenCalled();
  expect(session.update.mock).not.toHaveBeenCalled();

  const updator = moxy(async () => ({ foo: 'baz' }));
  expect(setState(updator)).toBe(undefined);

  expect(thunk.mock).toHaveBeenCalledTimes(1);
  expect(thunk.mock).toHaveBeenCalledWith(expect.any(Function));
  const thunked = thunk.mock.calls[0].args[0];

  expect(thunked()).resolves.toBe(undefined);
  expect(session.update.mock).toHaveBeenCalledTimes(1);
  expect(session.update.mock).toHaveBeenCalledWith('some_key', updator);
});

it('throw if session not provided', () =>
  expect(
    StateService._serve()({ key: 'some_key' }, () => {})
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"session in provided among the scope of <StateService.Consumer />"`
  ));
