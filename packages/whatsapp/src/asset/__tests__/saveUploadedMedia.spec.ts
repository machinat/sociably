import moxy from '@moxyjs/moxy';
import saveUploadedMedia from '../saveUploadedMedia';
import AssetsManager from '../AssetsManager';

const manager = moxy<AssetsManager>({
  saveMedia: async () => {},
} as never);

beforeEach(() => {
  manager.mock.clear();
});

it('do nothing when job has no assetTag', async () => {
  const msgResult = { code: 200, headers: {}, body: {} };
  const response = {
    jobs: [
      { request: { ...{} } },
      { request: { ...{} } },
      { request: { ...{} } },
    ],
    results: [msgResult, msgResult, msgResult],
  };
  const next = moxy(async () => response as never);
  const context = { hello: 'droid' };

  await expect(
    saveUploadedMedia(manager)(context as any, next)
  ).resolves.toEqual(response);

  expect(next.mock).toHaveBeenCalledTimes(1);
  expect(next.mock).toHaveBeenCalledWith(context);

  expect(manager.saveMedia.mock).not.toHaveBeenCalled();
});

it('save created asset', async () => {
  const msgResult = { code: 200, headers: {}, body: {} };
  const response = {
    jobs: [
      { assetTag: 'foo', request: { ...{} } },
      { request: { ...{} } },
      { assetTag: 'bar', request: { ...{} } },
      { request: { ...{} } },
      { assetTag: 'baz', request: { ...{} } },
      { request: { ...{} } },
    ],
    results: [
      {
        ...msgResult,
        body: { id: '111111111' },
      },
      msgResult,
      {
        ...msgResult,
        body: { id: '222222222' },
      },
      msgResult,
      {
        ...msgResult,
        body: { id: '333333333' },
      },
      msgResult,
    ],
  };
  const next = moxy(async () => response as never);
  const context = { hello: 'droid' };

  await expect(
    saveUploadedMedia(manager)(context as any, next)
  ).resolves.toEqual(response);

  expect(next.mock).toHaveBeenCalledTimes(1);
  expect(next.mock).toHaveBeenCalledWith(context);

  expect(manager.saveMedia.mock).toHaveBeenCalledTimes(3);
  expect(manager.saveMedia.mock).toHaveBeenNthCalledWith(1, 'foo', '111111111');
  expect(manager.saveMedia.mock).toHaveBeenNthCalledWith(2, 'bar', '222222222');
  expect(manager.saveMedia.mock).toHaveBeenNthCalledWith(3, 'baz', '333333333');
});