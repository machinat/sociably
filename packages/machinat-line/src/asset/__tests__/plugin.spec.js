import moxy from 'moxy';
import lineAssetsPlugin from '../plugin';
import LineAssetsAccessor from '../accessor';

jest.mock('../accessor', () => jest.requireActual('moxy').default());

const store = moxy();
const bot = moxy();
const next = moxy(async () => ({ foo: 'bar' }));
const frame = { hello: 'droid' };

beforeEach(() => {
  LineAssetsAccessor.mock.clear();
  next.mock.clear();
});

it('attach accessor to event frame', async () => {
  await expect(
    lineAssetsPlugin(store)(bot).eventMiddleware(next)(frame)
  ).resolves.toEqual({
    foo: 'bar',
  });

  expect(next.mock).toHaveBeenCalledTimes(1);
  expect(next.mock).toHaveBeenCalledWith({
    hello: 'droid',
    assets: expect.any(LineAssetsAccessor),
  });

  expect(LineAssetsAccessor.mock).toHaveBeenCalledTimes(1);
  expect(LineAssetsAccessor.mock).toHaveBeenCalledWith(store, bot);

  expect(next.mock.calls[0].args[0].assets).toBe(
    LineAssetsAccessor.mock.calls[0].instance
  );
});
