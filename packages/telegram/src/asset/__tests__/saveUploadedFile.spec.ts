import { DispatchError } from '@sociably/core/engine';
import { moxy, Moxy } from '@moxyjs/moxy';
import type AssetsManagerP from '../AssetsManager.js';
import saveUploadedFile from '../saveUploadedFile.js';
import TelegramUser from '../../User.js';

const sendMessageJob = {
  method: 'sendMessage',
  params: {
    chai_id: 12345,
    text: 'foo',
  },
  files: [],
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
} as never);

const agentId = 12345;
const botUser = new TelegramUser(agentId, true);

const mediaMethodPairs = [
  ['animation', 'sendAnimation'],
  ['audio', 'sendAudio'],
  ['document', 'sendDocument'],
  ['video', 'sendVideo'],
  ['video_note', 'sendVideoNote'],
  ['voice', 'sendVoice'],
  ['sticker', 'sendSticker'],
];

const fileData = Buffer.from('__BINARY_DATA__');

beforeEach(() => {
  manager.mock.reset();
});

it('ignore noraml messages and media message without assetTag', async () => {
  const frame = moxy();

  const response = {
    tasks: [],
    jobs: [
      sendMessageJob,
      {
        agentId,
        method: 'sendPhoto',
        params: { chat_id: 67890 },
        files: [
          { fieldName: 'photo', fileData },
          { fieldName: 'thumb', fileData },
        ],
      },
      ...mediaMethodPairs.map(([mediaType, method]) => ({
        agentId,
        method,
        params: { chat_id: 67890 },
        files: [
          { fieldName: mediaType, fileData },
          { fieldName: 'thumb', fileData },
        ],
      })),
    ],
    results: [
      sendMessageResult,
      sendPhotoResult,
      ...mediaMethodPairs.map(([mediaType]) => makeMediaResult(mediaType)),
    ],
  };

  const next = moxy(async () => response as never);

  await expect(saveUploadedFile(manager)(frame, next)).resolves.toBe(response);
  expect(manager.saveFile).not.toHaveBeenCalled();
});

it('save files uploaded when sending media with assetTag', async () => {
  const frame = moxy();

  const sendPhotoJob = {
    agentId,
    method: 'sendPhoto',
    params: { chat_id: 67890 },
    files: [
      { fieldName: 'photo', assetTag: 'my_photo', fileData },
      { fieldName: 'thumb', fileData },
    ],
  };

  const sendOtherMediaJobs = mediaMethodPairs.map(([mediaType, method]) => ({
    agentId,
    method,
    params: { chat_id: 67890 },
    files: [
      { fieldName: mediaType, assetTag: `my_${mediaType}`, fileData },
      { fieldName: 'thumb', fileData },
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

  const next = async () => response as never;

  await expect(saveUploadedFile(manager)(frame, next)).resolves.toBe(response);

  expect(manager.saveFile).toHaveBeenCalledTimes(mediaMethodPairs.length + 1);
  expect(manager.saveFile).toHaveBeenCalledWith(
    botUser,
    'my_photo',
    '_PHOTO_L_ID_'
  );
  mediaMethodPairs.forEach(([mediaType]) => {
    expect(manager.saveFile).toHaveBeenCalledWith(
      botUser,
      `my_${mediaType}`,
      `_${mediaType.toUpperCase()}_ID_`
    );
  });
});

it('save uploaded media when partial success', async () => {
  const frame = moxy();
  const error = new DispatchError(
    [new Error('foo')],
    [],
    [
      {
        agentId,
        method: 'sendPhoto',
        params: { chat_id: 67890 },
        files: [{ fieldName: 'photo', assetTag: 'my_photo', fileData }],
      },
      ...mediaMethodPairs.map(([mediaType, method]) => ({
        agentId,
        method,
        params: { chat_id: 67890 },
        files: [
          { fieldName: mediaType, assetTag: `my_${mediaType}`, fileData },
        ],
      })),
      sendMessageJob,
    ],
    [
      sendPhotoResult,
      ...mediaMethodPairs.map(([mediaType]) => makeMediaResult(mediaType)),
      undefined,
    ]
  );

  const next = async () => {
    throw error;
  };

  await expect(saveUploadedFile(manager)(frame, next)).rejects.toThrowError(
    error
  );

  expect(manager.saveFile).toHaveBeenCalledTimes(mediaMethodPairs.length + 1);
  expect(manager.saveFile).toHaveBeenCalledWith(
    botUser,
    'my_photo',
    '_PHOTO_L_ID_'
  );
  mediaMethodPairs.forEach(([mediaType]) => {
    expect(manager.saveFile).toHaveBeenCalledWith(
      botUser,
      `my_${mediaType}`,
      `_${mediaType.toUpperCase()}_ID_`
    );
  });
});

it('save files uploaded by editMessageMedia with assetTag', async () => {
  const frame = moxy();
  const editableMedias = ['animation', 'audio', 'document', 'video'];

  const editPhotoJob = {
    agentId,
    method: 'editMessageMedia',
    params: {
      chat_id: 67890,
      message_id: 456,
      media: {
        type: 'photo',
        media: 'attach://photo',
        thumb: 'attach://thumb',
      },
    },
    files: [
      { fieldName: 'photo', assetTag: 'my_photo', fileData },
      { fieldName: 'thumb', fileData },
    ],
  };

  const editOtherMediaJobs = editableMedias.map((mediaType) => ({
    agentId,
    method: 'editMessageMedia',
    params: {
      chat_id: 67890,
      message_id: 456,
      media: {
        type: mediaType,
        media: `attach://${mediaType}`,
        thumb: 'attach://thumb',
        // rest of properties
      },
    },
    files: [
      { fieldName: mediaType, assetTag: `my_${mediaType}`, fileData },
      { fieldName: 'thumb', fileData },
    ],
  }));

  const response = {
    tasks: [],
    jobs: [editPhotoJob, ...editOtherMediaJobs],
    results: [sendPhotoResult, ...editableMedias.map(makeMediaResult)],
  };

  const next = async () => response as never;

  await expect(saveUploadedFile(manager)(frame, next)).resolves.toBe(response);

  expect(manager.saveFile).toHaveBeenCalledTimes(5);
  expect(manager.saveFile).toHaveBeenCalledWith(
    botUser,
    'my_photo',
    '_PHOTO_L_ID_'
  );
  editableMedias.forEach((mediaType) => {
    expect(manager.saveFile).toHaveBeenCalledWith(
      botUser,
      `my_${mediaType}`,
      `_${mediaType.toUpperCase()}_ID_`
    );
  });
});

it('save files uploaded by sendMediaGroup with assetTag', async () => {
  const frame = moxy();

  const response = {
    tasks: [],
    jobs: [
      sendMessageJob,
      {
        agentId,
        method: 'sendMediaGroup',
        params: {
          chat_id: 67890,
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
        files: [
          { fieldName: 'file_0', assetTag: 'my_photo', fileData },
          { fieldName: 'file_1', fileData },
          { fieldName: 'file_2', assetTag: 'my_video', fileData },
          { fieldName: 'file_3', fileData },
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

  const next = async () => response as never;

  await expect(saveUploadedFile(manager)(frame, next)).resolves.toBe(response);

  expect(manager.saveFile).toHaveBeenCalledTimes(2);
  expect(manager.saveFile).toHaveBeenCalledWith(
    botUser,
    'my_photo',
    '_PHOTO_L_ID_'
  );
  expect(manager.saveFile).toHaveBeenCalledWith(
    botUser,
    'my_video',
    '_VIDEO_ID_'
  );
});
