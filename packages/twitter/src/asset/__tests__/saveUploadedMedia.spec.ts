import { DispatchError } from '@sociably/core/engine';
import { moxy, Moxy } from '@moxyjs/moxy';
import TwitterChat from '../../Chat.js';
import type AssetsManagerP from '../AssetsManager.js';
import saveUploadedMedia from '../saveUploadedMedia.js';

const manager: Moxy<AssetsManagerP> = moxy({
  async saveMedia() {},
} as never);

beforeEach(() => {
  manager.mock.reset();
});

const chat = new TwitterChat('1234567890', '9876543210');

const jobs = [
  {
    target: chat,
    request: {
      method: 'POST',
      url: '2/tweets',
      params: { text: 'foo', media: {} },
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
    target: chat,
    request: {
      method: 'POST',
      url: '2/tweets',
      params: { text: 'bar', media: {} },
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
    target: chat,
    request: {
      method: 'POST',
      url: '2/tweets',
      params: { text: 'baz', media: {} },
    },
    mediaSources: [
      { sourceType: 'url', type: 'animated_gif', url: 'https://...' },
    ],
  },
];

const results = [
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
];

it('save uploaded media with assetTag', async () => {
  const frame = moxy();
  const response = { tasks: [], jobs, results };

  const next = moxy(async () => response as never);
  await expect(saveUploadedMedia(manager)(frame, next)).resolves.toBe(response);

  expect(manager.saveMedia).toHaveBeenCalledTimes(3);
  expect(manager.saveMedia).toHaveBeenNthCalledWith(
    1,
    chat.agent,
    'media_1',
    '2222222222222222'
  );
  expect(manager.saveMedia).toHaveBeenNthCalledWith(
    2,
    chat.agent,
    'media_2',
    '4444444444444444'
  );
  expect(manager.saveMedia).toHaveBeenNthCalledWith(
    3,
    chat.agent,
    'media_3',
    '5555555555555555'
  );
});

it('do nothing if no assetTag labeled', async () => {
  const frame = moxy();
  const response = {
    tasks: [],
    jobs,
    results: results.map((result) => ({
      ...result,
      uploadedMedia: result.uploadedMedia?.map((media) => ({
        ...media,
        assetTag: undefined,
      })),
    })),
  };

  const next = moxy(async () => response as never);
  await expect(saveUploadedMedia(manager)(frame, next)).resolves.toBe(response);

  expect(manager.saveMedia).not.toHaveBeenCalled();
});

it('do nothing if job target is null', async () => {
  const frame = moxy();
  const response = {
    tasks: [],
    jobs,
    results: results.map((result) => ({
      ...result,
      uploadedMedia: result.uploadedMedia?.map((media) => ({
        ...media,
        assetTag: undefined,
      })),
    })),
  };

  const next = moxy(async () => response as never);
  await expect(saveUploadedMedia(manager)(frame, next)).resolves.toBe(response);

  expect(manager.saveMedia).not.toHaveBeenCalled();
});

it('pop error up', async () => {
  const frame = moxy();

  const next = moxy(async () => {
    throw new Error('BOOM');
  });
  await expect(saveUploadedMedia(manager)(frame, next)).rejects.toThrow('BOOM');
});

it('save uploaded media when partial success', async () => {
  const frame = moxy();
  const error = new DispatchError(
    [new Error('foo'), new Error('bar')],
    [],
    jobs,
    [...results.slice(0, 2), undefined]
  );

  const next = moxy(async () => {
    throw error;
  });
  await expect(saveUploadedMedia(manager)(frame, next)).rejects.toThrowError(
    error
  );

  expect(manager.saveMedia).toHaveBeenCalledTimes(3);
  expect(manager.saveMedia).toHaveBeenNthCalledWith(
    1,
    chat.agent,
    'media_1',
    '2222222222222222'
  );
  expect(manager.saveMedia).toHaveBeenNthCalledWith(
    2,
    chat.agent,
    'media_2',
    '4444444444444444'
  );
  expect(manager.saveMedia).toHaveBeenNthCalledWith(
    3,
    chat.agent,
    'media_3',
    '5555555555555555'
  );
});
