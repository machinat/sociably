import moxy from 'moxy';
import StateService from '../StateService';

const session = moxy({
  get: async () => ({ foo: 'bar' }),
  update: async () => {},
});

it('work', async () => {
  const thunk = moxy();
  const consumingPromise = StateService._serve(session)('some_key', thunk);

  await expect(consumingPromise).resolves.toEqual([
    { foo: 'bar' },
    expect.any(Function),
  ]);

  expect(session.get.mock).toHaveBeenCalledTimes(1);
  expect(session.get.mock).toHaveBeenCalledWith('some_key');

  const [, updateState] = await consumingPromise;

  expect(thunk.mock).not.toHaveBeenCalled();
  expect(session.update.mock).not.toHaveBeenCalled();

  const updator = moxy(async () => ({ foo: 'baz' }));
  expect(updateState(updator)).toBe(undefined);

  expect(thunk.mock).toHaveBeenCalledTimes(1);
  expect(thunk.mock).toHaveBeenCalledWith(expect.any(Function));
  const thunked = thunk.mock.calls[0].args[0];

  expect(thunked()).resolves.toBe(undefined);
  expect(session.update.mock).toHaveBeenCalledTimes(1);
  expect(session.update.mock).toHaveBeenCalledWith('some_key', updator);
});

it('throw if session not provided', () =>
  expect(
    StateService._serve()('some_key', () => {})
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"session in provided among the scope of <StateService.Consumer />"`
  ));
