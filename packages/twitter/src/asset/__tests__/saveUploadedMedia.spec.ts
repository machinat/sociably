import moxy, { Moxy } from '@moxyjs/moxy';
import type AssetsManagerP from '../AssetsManager';
import saveUploadedMedia from '../saveUploadedMedia';

const manager: Moxy<AssetsManagerP> = moxy({
  async saveMedia() {},
} as any);

beforeEach(() => {
  manager.mock.reset();
});

it('save uploaded media with assetTag', async () => {
  const frame = moxy();
  const response = {
    tasks: [],
    jobs: [
      {
        request: {
          method: 'POST',
          href: '2/tweets',
          parameters: { text: 'foo', media: {} },
        },
        mediaSources: [
          { sourceType: 'id', type: 'photo', id: '11111111111111' },
          {
            sourceType: 'url',
            type: 'photo',
            url: 'https://...',
            assetTag: 'media_1',
          },
          {
            sourceType: 'file',
            type: 'photo',
            fileData: '__FILE_BINARY__',
          },
          {
            sourceType: 'file',
            type: 'photo',
            fileData: '__FILE_BINARY__',
            assetTag: 'media_2',
          },
        ],
      },
      {
        request: {
          method: 'POST',
          href: '2/tweets',
          parameters: { text: 'bar', media: {} },
        },
        mediaSources: [
          {
            sourceType: 'file',
            type: 'video',
            fileData: '__FILE_BINARY__',
            assetTag: 'media_3',
          },
        ],
      },
      {
        request: {
          method: 'POST',
          href: '2/tweets',
          parameters: { text: 'baz', media: {} },
        },
        mediaSources: [
          { sourceType: 'url', type: 'animated_gif', url: 'https://...' },
        ],
      },
    ],
    results: [
      {
        code: 200,
        body: { data: { text: 'foo' } },
        uploadedMedia: [
          {
            type: 'photo',
            assetTag: 'media_1',
            result: {
              media_id: BigInt('2222222222222222'),
              media_id_string: '2222222222222222',
              expires_after_secs: 48600,
              size: 9999,
            },
          },
          {
            type: 'photo',
            assetTag: undefined,
            result: {
              media_id: BigInt('3333333333333333'),
              media_id_string: '3333333333333333',
              expires_after_secs: 48600,
              size: 9999,
            },
          },
          {
            type: 'photo',
            assetTag: 'media_2',
            result: {
              media_id: BigInt('4444444444444444'),
              media_id_string: '4444444444444444',
              expires_after_secs: 48600,
              size: 9999,
            },
          },
        ],
      },
      {
        code: 200,
        body: { data: { text: 'bar' } },
        uploadedMedia: [
          {
            type: 'video',
            assetTag: 'media_3',
            result: {
              media_id: BigInt('5555555555555555'),
              media_id_string: '5555555555555555',
              expires_after_secs: 48600,
              size: 9999,
            },
          },
        ],
      },
      { code: 200, body: { data: { text: 'baz' } }, uploadedMedia: null },
    ],
  };

  const next = moxy(async () => response as any);
  await expect(saveUploadedMedia(manager)(frame, next)).resolves.toBe(response);

  expect(manager.saveMedia.mock).toHaveBeenCalledTimes(3);
  expect(manager.saveMedia.mock).toHaveBeenNthCalledWith(
    1,
    'media_1',
    '2222222222222222'
  );
  expect(manager.saveMedia.mock).toHaveBeenNthCalledWith(
    2,
    'media_2',
    '4444444444444444'
  );
  expect(manager.saveMedia.mock).toHaveBeenNthCalledWith(
    3,
    'media_3',
    '5555555555555555'
  );
});

it('pop errors up', async () => {
  const frame = moxy();

  const next = moxy(async () => {
    throw new Error('BOOM');
  });
  await expect(saveUploadedMedia(manager)(frame, next)).rejects.toThrow('BOOM');
});
