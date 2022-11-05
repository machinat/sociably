import Sociably from '@sociably/core';
import moxy from '@moxyjs/moxy';
import { createChatJobs, createUploadingMediaJobs } from '../job';
import WhatsAppChat from '../Chat';

describe('createChatJobs', () => {
  test('create jobs from text segments', () => {
    const chat = new WhatsAppChat('1234567890', '9876543210');

    expect(
      createChatJobs(chat, [
        { type: 'text', value: 'FOO', node: 'FOO', path: '$:0' },
        { type: 'text', value: 'BAR', node: 'BAR', path: '$:1' },
        { type: 'text', value: 'BAZ', node: 'BAZ', path: '$:2' },
      ])
    ).toEqual(
      ['FOO', 'BAR', 'BAZ'].map((text) => ({
        key: chat.uid,
        request: {
          method: 'POST',
          relative_url: '1234567890/messages',
          body: {
            type: 'text',
            text,
            to: '9876543210',
            messaging_product: 'whatsapp',
          },
        },
      }))
    );
  });

  test('create jobs from unit segments', () => {
    const chat = new WhatsAppChat('1234567890', '9876543210');

    expect(
      createChatJobs(chat, [
        { type: 'text', value: 'FOO', node: 'FOO', path: '$:0' },
        {
          type: 'unit',
          value: { message: { type: 'text', text: 'BAR' } },
          node: <bar />,
          path: '$:1',
        },
        {
          type: 'unit',
          value: {
            message: {
              type: 'image',
              image: { caption: 'BAZ', link: 'http://foo.bar/baz.jpg' },
            },
          },
          node: <baz />,
          path: '$:2',
        },
      ])
    ).toEqual([
      {
        key: chat.uid,
        request: {
          method: 'POST',
          relative_url: '1234567890/messages',
          body: {
            type: 'text',
            text: 'FOO',
            to: '9876543210',
            messaging_product: 'whatsapp',
          },
        },
      },
      {
        key: chat.uid,
        request: {
          method: 'POST',
          relative_url: '1234567890/messages',
          body: {
            type: 'text',
            text: 'BAR',
            to: '9876543210',
            messaging_product: 'whatsapp',
          },
        },
      },
      {
        key: chat.uid,
        request: {
          method: 'POST',
          relative_url: '1234567890/messages',
          body: {
            type: 'image',
            image: { caption: 'BAZ', link: 'http://foo.bar/baz.jpg' },
            to: '9876543210',
            messaging_product: 'whatsapp',
          },
        },
      },
    ]);
  });

  test('create jobs with media file to upload', () => {
    const chat = new WhatsAppChat('1234567890', '9876543210');

    const jobs = createChatJobs(chat, [
      {
        type: 'unit',
        value: {
          message: { type: 'image', image: { caption: 'FOO' } },
          mediaFile: { type: 'image/jpeg', data: '_IMAGE_BLOB_DATA_' },
        },
        node: <image />,
        path: '$:0',
      },
      {
        type: 'unit',
        value: {
          message: { type: 'audio', audio: { caption: 'BAR' } },
          mediaFile: {
            type: 'audio/mp3',
            data: '_AUDIO_BLOB_DATA_',
            info: { filename: 'meow.mp3' },
            assetTag: 'foo_mp3',
          },
        },
        node: <audio />,
        path: '$:1',
      },
    ]);

    expect(jobs).toEqual([
      {
        key: chat.uid,
        request: {
          method: 'POST',
          relative_url: '1234567890/media',
          body: { type: 'image/jpeg', messaging_product: 'whatsapp' },
        },
        fileData: '_IMAGE_BLOB_DATA_',
        registerResult: expect.any(String),
      },
      {
        key: chat.uid,
        request: {
          method: 'POST',
          relative_url: '1234567890/messages',
          body: {
            type: 'image',
            image: { caption: 'FOO' },
            to: '9876543210',
            messaging_product: 'whatsapp',
          },
        },
        consumeResult: {
          keys: [expect.any(String)],
          accomplishRequest: expect.any(Function),
        },
      },
      {
        key: chat.uid,
        request: {
          method: 'POST',
          relative_url: '1234567890/media',
          body: { type: 'audio/mp3', messaging_product: 'whatsapp' },
        },
        fileData: '_AUDIO_BLOB_DATA_',
        fileInfo: { filename: 'meow.mp3' },
        registerResult: expect.any(String),
        assetTag: 'foo_mp3',
      },
      {
        key: chat.uid,
        request: {
          method: 'POST',
          relative_url: '1234567890/messages',
          body: {
            type: 'audio',
            audio: { caption: 'BAR' },
            to: '9876543210',
            messaging_product: 'whatsapp',
          },
        },
        consumeResult: {
          keys: [expect.any(String)],
          accomplishRequest: expect.any(Function),
        },
      },
    ]);

    expect(jobs[0].registerResult).toBe(jobs[1].consumeResult?.keys[0]);
    expect(jobs[2].registerResult).toBe(jobs[3].consumeResult?.keys[0]);
    expect(jobs[0].registerResult).not.toBe(jobs[2].registerResult);

    const getResultValue = moxy();
    getResultValue.mock.fakeReturnValueOnce('1111111111');
    getResultValue.mock.fakeReturnValueOnce('2222222222');

    expect(
      jobs[1].consumeResult?.accomplishRequest(
        jobs[1].request,
        [jobs[0].registerResult as string],
        getResultValue
      )
    ).toEqual({
      body: {
        to: '9876543210',
        type: 'image',
        image: { id: '1111111111', caption: 'FOO' },
        messaging_product: 'whatsapp',
      },
      method: 'POST',
      relative_url: '1234567890/messages',
    });
    expect(
      jobs[3].consumeResult?.accomplishRequest(
        jobs[3].request,
        [jobs[2].registerResult as string],
        getResultValue
      )
    ).toEqual({
      body: {
        to: '9876543210',
        type: 'audio',
        audio: { id: '2222222222', caption: 'BAR' },
        messaging_product: 'whatsapp',
      },
      method: 'POST',
      relative_url: '1234567890/messages',
    });

    expect(getResultValue.mock).toHaveBeenCalledTimes(2);
    expect(getResultValue.mock).toHaveBeenNthCalledWith(
      1,
      jobs[0].registerResult,
      '$.id'
    );
    expect(getResultValue.mock).toHaveBeenNthCalledWith(
      2,
      jobs[2].registerResult,
      '$.id'
    );
  });
});

describe('createUploadingMediaJobs', () => {
  it('create an upload job', () => {
    expect(
      createUploadingMediaJobs('1234567890')(null, [
        {
          type: 'unit',
          value: {
            message: { type: 'image', image: {} },
            mediaFile: { type: 'image/jpeg', data: '_IMAGE_BLOB_DATA_' },
          },
          node: <image />,
          path: '$:0',
        },
      ])
    ).toEqual([
      {
        request: {
          method: 'POST',
          relative_url: '1234567890/media',
          body: { type: 'image/jpeg', messaging_product: 'whatsapp' },
        },
        fileData: '_IMAGE_BLOB_DATA_',
      },
    ]);
    expect(
      createUploadingMediaJobs('1234567890')(null, [
        {
          type: 'unit',
          value: {
            message: { type: 'audio', audio: {} },
            mediaFile: {
              type: 'audio/mp3',
              data: '_AUDIO_BLOB_DATA_',
              info: { filename: 'foo.mp3' },
              assetTag: 'foo_mp3',
            },
          },
          node: <audio />,
          path: '$:0',
        },
      ])
    ).toEqual([
      {
        request: {
          method: 'POST',
          relative_url: '1234567890/media',
          body: { type: 'audio/mp3', messaging_product: 'whatsapp' },
        },
        fileData: '_AUDIO_BLOB_DATA_',
        fileInfo: { filename: 'foo.mp3' },
        assetTag: 'foo_mp3',
      },
    ]);
  });

  it('throw if more than one segment received', () => {
    expect(() =>
      createUploadingMediaJobs('1234567890')(null, [
        {
          type: 'unit',
          value: {
            message: { type: 'image', image: {} },
            mediaFile: {
              type: 'image/jpeg',
              data: '_IMAGE_BLOB_DATA_',
              info: { filename: 'foo.jpg' },
            },
          },
          node: <media />,
          path: '$:0',
        },
        {
          type: 'unit',
          value: {
            message: { type: 'audio', audio: {} },
            mediaFile: {
              type: 'audio/mp3',
              data: '_AUDIO_BLOB_DATA_',
              info: { filename: 'bar.mp3' },
            },
          },
          node: <media />,
          path: '$:1',
        },
      ])
    ).toThrowErrorMatchingInlineSnapshot(
      `"there should be only one media to be uploaded"`
    );
  });

  it('throw if non media segment received', () => {
    expect(() =>
      createUploadingMediaJobs('1234567890')(null, [
        { type: 'text', value: 'FOO', node: 'FOO', path: '$:0' },
      ])
    ).toThrowErrorMatchingInlineSnapshot(
      `"\\"FOO\\" is not a media with file data"`
    );

    expect(() =>
      createUploadingMediaJobs('1234567890')(null, [
        {
          type: 'unit',
          value: { message: { type: 'text', text: 'BAR' } },
          node: <bar />,
          path: '$:0',
        },
      ])
    ).toThrowErrorMatchingInlineSnapshot(
      `"<bar /> is not a media with file data"`
    );
  });

  it('throw if media type is id or link', () => {
    expect(() =>
      createUploadingMediaJobs('1234567890')(null, [
        {
          type: 'unit',
          value: { message: { type: 'image', image: { id: '1111111111' } } },
          node: <image />,
          path: '$:0',
        },
      ])
    ).toThrowErrorMatchingInlineSnapshot(
      `"<image /> is not a media with file data"`
    );

    expect(() =>
      createUploadingMediaJobs('1234567890')(null, [
        {
          type: 'unit',
          value: {
            message: {
              type: 'audio',
              audio: { link: 'http://foo.bar/baz.mp3' },
            },
          },
          node: <audio />,
          path: '$:0',
        },
      ])
    ).toThrowErrorMatchingInlineSnapshot(
      `"<audio /> is not a media with file data"`
    );
  });
});
