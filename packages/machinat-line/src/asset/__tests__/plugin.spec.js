import moxy from 'moxy';
import lineAssetPlugin from '../plugin';
import LineAssetManager from '../manager';

jest.mock('../manager', () => jest.requireActual('moxy').default());

const store = moxy();
const bot = moxy();
const next = moxy(async () => ({ foo: 'bar' }));
const frame = { hello: 'droid' };

beforeEach(() => {
  LineAssetManager.mock.clear();
  next.mock.clear();
});

it('attach accessor to event frame', async () => {
  await expect(
    lineAssetPlugin(store)(bot).eventMiddleware(next)(frame)
  ).resolves.toEqual({
    foo: 'bar',
  });

  expect(next.mock).toHaveBeenCalledTimes(1);
  expect(next.mock).toHaveBeenCalledWith({
    hello: 'droid',
    assets: expect.any(LineAssetManager),
  });

  expect(LineAssetManager.mock).toHaveBeenCalledTimes(1);
  expect(LineAssetManager.mock).toHaveBeenCalledWith(store, bot);

  expect(next.mock.calls[0].args[0].assets).toBe(
    LineAssetManager.mock.calls[0].instance
  );
});
