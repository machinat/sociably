import moxy from 'moxy';
import lineAssetPlugin from '../plugin';
import LineAssetRepository from '../repository';

jest.mock('../repository', () => jest.requireActual('moxy').default());

const store = moxy();
const bot = moxy();
const next = moxy(async () => ({ foo: 'bar' }));
const frame = { hello: 'droid' };

beforeEach(() => {
  LineAssetRepository.mock.clear();
  next.mock.clear();
});

it('attach repository to event frame', async () => {
  await expect(
    lineAssetPlugin(store)(bot).eventMiddleware(next)(frame)
  ).resolves.toEqual({
    foo: 'bar',
  });

  expect(next.mock).toHaveBeenCalledTimes(1);
  expect(next.mock).toHaveBeenCalledWith({
    hello: 'droid',
    assets: expect.any(LineAssetRepository),
  });

  expect(LineAssetRepository.mock).toHaveBeenCalledTimes(1);
  expect(LineAssetRepository.mock).toHaveBeenCalledWith(store, bot);

  expect(next.mock.calls[0].args[0].assets).toBe(
    LineAssetRepository.mock.calls[0].instance
  );
});
