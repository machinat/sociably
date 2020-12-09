import moxy, { Moxy } from '@moxyjs/moxy';
import type { AssetsManagerP } from '../manager';
import saveUploadedFile from '../saveUploadedFile';

const sendMessageJob = {
  method: 'sendMessage',
  parameters: {
    chai_id: 12345,
    text: 'foo',
  },
  uploadingFiles: [],
};

const sendMessageResult = {
  ok: true,
  result: {
    id: 123,
    text: 'foo',
  },
};

const sendPhotoResult = {
  ok: true,
  result: {
    id: 456,
    from: {},
    chat: {},
    photo: [
      {
        file_id: '_PHOTO_S_ID_',
        file_unique_id: '_FILE_UNIQUE_ID_S_',
        file_size: 2000000,
        width: 200,
        height: 200,
      },
      {
        file_id: '_PHOTO_M_ID_',
        file_unique_id: '_FILE_UNIQUE_ID_M_',
        file_size: 4000000,
        width: 400,
        height: 400,
      },
      {
        file_id: '_PHOTO_L_ID_',
        file_unique_id: '_FILE_UNIQUE_ID_L_',
        file_size: 6000000,
        width: 600,
        height: 600,
      },
    ],
  },
};

const makeMediaResult = (mediaType: string) => ({
  ok: true,
  result: {
    id: 456,
    date: 12345678,
    from: {},
    chat: {},
    [mediaType]: {
      file_id: `_${mediaType.toUpperCase()}_ID_`,
      file_unique_id: '_FILE_UNIQUE_ID_',
      file_size: 9999,
      // rest of properties
    },
  },
});

const manager: Moxy<AssetsManagerP> = moxy({
  async saveFile() {},
} as any);

const mediaMethodPairs = [
  ['animation', 'sendAnimation'],
  ['audio', 'sendAudio'],
  ['document', 'sendDocument'],
  ['video', 'sendVideo'],
  ['video_note', 'sendVideoNote'],
  ['voice', 'sendVoice'],
  ['sticker', 'sendSticker'],
];

beforeEach(() => {
  manager.mock.reset();
});

it('ignore noraml messages and media message without fileAssetTag', async () => {
  const frame = moxy();

  const response = {
    tasks: [],
    jobs: [
      sendMessageJob,
      {
        method: 'sendPhoto',
        parameters: { chat_id: 12345 },
        uploadingFiles: [
          { fieldName: 'photo', fileData: Buffer.from('__BINARY_DATA__') },
          { fieldName: 'thumb', fileData: Buffer.from('__BINARY_DATA__') },
        ],
      },
      ...mediaMethodPairs.map(([mediaType, method]) => ({
        method,
        parameters: { chat_id: 12345 },
        uploadingFiles: [
          { fieldName: mediaType, fileData: Buffer.from('__BINARY_DATA__') },
          { fieldName: 'thumb', fileData: Buffer.from('__BINARY_DATA__') },
        ],
      })),
    ],
    results: [
      sendMessageResult,
      sendPhotoResult,
      ...mediaMethodPairs.map(([mediaType]) => makeMediaResult(mediaType)),
    ],
  };

  const next = moxy(async () => response as any);

  await expect(saveUploadedFile(manager)(frame, next)).resolves.toBe(response);
  expect(manager.saveFile.mock).not.toHaveBeenCalled();
});

it('save files uploaded when sending media with fileAssetTag', async () => {
  const frame = moxy();

  const sendPhotoJob = {
    method: 'sendPhoto',
    parameters: { chat_id: 12345 },
    uploadingFiles: [
      {
        fieldName: 'photo',
        fileData: Buffer.from('__BINARY_DATA__'),
        fileAssetTag: 'my_photo',
      },
      {
        fieldName: 'thumb',
        fileData: Buffer.from('__BINARY_DATA__'),
      },
    ],
  };

  const sendOtherMediaJobs = mediaMethodPairs.map(([mediaType, method]) => ({
    method,
    parameters: { chat_id: 12345 },
    uploadingFiles: [
      {
        fieldName: mediaType,
        fileData: Buffer.from('__BINARY_DATA__'),
        fileAssetTag: `my_${mediaType}`,
      },
      {
        fieldName: 'thumb',
        fileData: Buffer.from('__BINARY_DATA__'),
      },
    ],
  }));

  const response = {
    tasks: [],
    jobs: [sendMessageJob, sendPhotoJob, ...sendOtherMediaJobs],
    results: [
      sendMessageResult,
      sendPhotoResult,
      ...mediaMethodPairs.map(([mediaType]) => makeMediaResult(mediaType)),
    ],
  };

  const next: any = async () => response;

  await expect(saveUploadedFile(manager)(frame, next)).resolves.toBe(response);

  expect(manager.saveFile.mock).toHaveBeenCalledTimes(
    mediaMethodPairs.length + 1
  );
  expect(manager.saveFile.mock).toHaveBeenCalledWith(
    'my_photo',
    '_PHOTO_L_ID_'
  );
  mediaMethodPairs.forEach(([mediaType]) => {
    expect(manager.saveFile.mock).toHaveBeenCalledWith(
      `my_${mediaType}`,
      `_${mediaType.toUpperCase()}_ID_`
    );
  });
});

it('save files uploaded by editMessageMedia with fileAssetTag', async () => {
  const frame = moxy();
  const editableMedias = ['animation', 'audio', 'document', 'video'];

  const editPhotoJob = {
    method: 'editMessageMedia',
    parameters: {
      chat_id: 12345,
      message_id: 456,
      media: {
        type: 'photo',
        media: 'attach://photo',
        thumb: 'attach://thumb',
      },
    },
    uploadingFiles: [
      {
        fieldName: 'photo',
        fileData: Buffer.from('__BINARY_DATA__'),
        fileAssetTag: 'my_photo',
      },
      {
        fieldName: 'thumb',
        fileData: Buffer.from('__BINARY_DATA__'),
      },
    ],
  };

  const editOtherMediaJobs = editableMedias.map((mediaType) => ({
    method: 'editMessageMedia',
    parameters: {
      chat_id: 12345,
      message_id: 456,
      media: {
        type: mediaType,
        media: `attach://${mediaType}`,
        thumb: 'attach://thumb',
        // rest of properties
      },
    },
    uploadingFiles: [
      {
        fieldName: mediaType,
        fileData: Buffer.from('__BINARY_DATA__'),
        fileAssetTag: `my_${mediaType}`,
      },
      {
        fieldName: 'thumb',
        fileData: Buffer.from('__BINARY_DATA__'),
      },
    ],
  }));

  const response = {
    tasks: [],
    jobs: [editPhotoJob, ...editOtherMediaJobs],
    results: [sendPhotoResult, ...editableMedias.map(makeMediaResult)],
  };

  const next: any = async () => response;

  await expect(saveUploadedFile(manager)(frame, next)).resolves.toBe(response);

  expect(manager.saveFile.mock).toHaveBeenCalledTimes(5);
  expect(manager.saveFile.mock).toHaveBeenCalledWith(
    'my_photo',
    '_PHOTO_L_ID_'
  );
  editableMedias.forEach((mediaType) => {
    expect(manager.saveFile.mock).toHaveBeenCalledWith(
      `my_${mediaType}`,
      `_${mediaType.toUpperCase()}_ID_`
    );
  });
});

it('save files uploaded by sendMediaGroup with fileAssetTag', async () => {
  const frame = moxy();

  const response = {
    tasks: [],
    jobs: [
      sendMessageJob,
      {
        method: 'sendMediaGroup',
        parameters: {
          chat_id: 12345,
          media: [
            {
              type: 'photo',
              media: 'attach://file_0',
              thumb: 'attach://file_1',
            },
            {
              type: 'video',
              media: 'attach://file_2',
              thumb: 'attach://file_3',
            },
          ],
        },
        uploadingFiles: [
          {
            fieldName: 'file_0',
            fileData: Buffer.from('__BINARY_DATA__'),
            fileAssetTag: 'my_photo',
          },
          {
            fieldName: 'file_1',
            fileData: Buffer.from('__BINARY_DATA__'),
          },
          {
            fieldName: 'file_2',
            fileData: Buffer.from('__BINARY_DATA__'),
            fileAssetTag: 'my_video',
          },
          {
            fieldName: 'file_3',
            fileData: Buffer.from('__BINARY_DATA__'),
          },
        ],
      },
    ],
    results: [
      sendMessageResult,
      {
        ok: true,
        result: [sendPhotoResult.result, makeMediaResult('video').result],
      },
    ],
  };

  const next: any = async () => response;

  await expect(saveUploadedFile(manager)(frame, next)).resolves.toBe(response);

  expect(manager.saveFile.mock).toHaveBeenCalledTimes(2);
  expect(manager.saveFile.mock).toHaveBeenCalledWith(
    'my_photo',
    '_PHOTO_L_ID_'
  );
  expect(manager.saveFile.mock).toHaveBeenCalledWith('my_video', '_VIDEO_ID_');
});
