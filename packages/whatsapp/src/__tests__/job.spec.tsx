import Sociably from '@sociably/core';
import { moxy } from '@moxyjs/moxy';
import { createChatJobs, createUploadingMediaJobs } from '../job.js';
import WhatsAppAgent from '../Agent.js';
import WhatsAppChat from '../Chat.js';

const agent = new WhatsAppAgent('1234567890');

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
        channel: agent,
        key: chat.uid,
        request: {
          method: 'POST',
          url: '1234567890/messages',
          params: {
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
        channel: agent,
        key: chat.uid,
        request: {
          method: 'POST',
          url: '1234567890/messages',
          params: {
            type: 'text',
            text: 'FOO',
            to: '9876543210',
            messaging_product: 'whatsapp',
          },
        },
      },
      {
        channel: agent,
        key: chat.uid,
        request: {
          method: 'POST',
          url: '1234567890/messages',
          params: {
            type: 'text',
            text: 'BAR',
            to: '9876543210',
            messaging_product: 'whatsapp',
          },
        },
      },
      {
        channel: agent,
        key: chat.uid,
        request: {
          method: 'POST',
          url: '1234567890/messages',
          params: {
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
          },
          assetTag: 'foo_mp3',
        },
        node: <audio />,
        path: '$:1',
      },
    ]);

    expect(jobs).toEqual([
      {
        channel: agent,
        key: chat.uid,
        request: {
          method: 'POST',
          url: '1234567890/media',
          params: { type: 'image/jpeg', messaging_product: 'whatsapp' },
        },
        file: { data: '_IMAGE_BLOB_DATA_' },
        registerResult: expect.any(String),
      },
      {
        channel: agent,
        key: chat.uid,
        request: {
          method: 'POST',
          url: '1234567890/messages',
          params: {
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
        channel: agent,
        key: chat.uid,
        request: {
          method: 'POST',
          url: '1234567890/media',
          params: { type: 'audio/mp3', messaging_product: 'whatsapp' },
        },
        file: {
          data: '_AUDIO_BLOB_DATA_',
          info: { filename: 'meow.mp3' },
        },
        assetTag: 'foo_mp3',
        registerResult: expect.any(String),
      },
      {
        channel: agent,
        key: chat.uid,
        request: {
          method: 'POST',
          url: '1234567890/messages',
          params: {
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
        [jobs[0].registerResult!],
        getResultValue
      )
    ).toEqual({
      params: {
        to: '9876543210',
        type: 'image',
        image: { id: '1111111111', caption: 'FOO' },
        messaging_product: 'whatsapp',
      },
      method: 'POST',
      url: '1234567890/messages',
    });
    expect(
      jobs[3].consumeResult?.accomplishRequest(
        jobs[3].request,
        [jobs[2].registerResult!],
        getResultValue
      )
    ).toEqual({
      params: {
        to: '9876543210',
        type: 'audio',
        audio: { id: '2222222222', caption: 'BAR' },
        messaging_product: 'whatsapp',
      },
      method: 'POST',
      url: '1234567890/messages',
    });

    expect(getResultValue).toHaveBeenCalledTimes(2);
    expect(getResultValue).toHaveBeenNthCalledWith(
      1,
      jobs[0].registerResult,
      '$.id'
    );
    expect(getResultValue).toHaveBeenNthCalledWith(
      2,
      jobs[2].registerResult,
      '$.id'
    );
  });
});

describe('createUploadingMediaJobs', () => {
  it('create an upload job', () => {
    expect(
      createUploadingMediaJobs(agent, [
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
        channel: agent,
        request: {
          method: 'POST',
          url: '1234567890/media',
          params: { type: 'image/jpeg', messaging_product: 'whatsapp' },
        },
        file: { data: '_IMAGE_BLOB_DATA_' },
      },
    ]);
    expect(
      createUploadingMediaJobs(agent, [
        {
          type: 'unit',
          value: {
            message: { type: 'audio', audio: {} },
            mediaFile: {
              type: 'audio/mp3',
              data: '_AUDIO_BLOB_DATA_',
              info: { filename: 'foo.mp3' },
            },
            assetTag: 'foo_mp3',
          },
          node: <audio />,
          path: '$:0',
        },
      ])
    ).toEqual([
      {
        channel: agent,
        request: {
          method: 'POST',
          url: '1234567890/media',
          params: { type: 'audio/mp3', messaging_product: 'whatsapp' },
        },
        file: {
          data: '_AUDIO_BLOB_DATA_',
          info: { filename: 'foo.mp3' },
        },
        assetTag: 'foo_mp3',
      },
    ]);
  });

  it('throw if more than one segment received', () => {
    expect(() =>
      createUploadingMediaJobs(agent, [
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
      createUploadingMediaJobs(agent, [
        { type: 'text', value: 'FOO', node: 'FOO', path: '$:0' },
      ])
    ).toThrowErrorMatchingInlineSnapshot(
      `""FOO" is not a media with file data"`
    );

    expect(() =>
      createUploadingMediaJobs(agent, [
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
      createUploadingMediaJobs(agent, [
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
      createUploadingMediaJobs(agent, [
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
