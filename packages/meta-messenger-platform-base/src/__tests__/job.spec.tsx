import moxy from '@moxyjs/moxy';
import Sociably from '@sociably/core';
import { UnitSegment, TextSegment } from '@sociably/core/renderer';
import { MetaApiChannel } from '@sociably/meta-api';
import { createChatJobs, createUploadChatAttachmentJobs } from '../job.js';
import { PATH_MESSAGES } from '../constant.js';
import { MessengerSegmentValue, MessengerChat } from '../types.js';

const _Date = Date;
const timeNow = 1667114251924;
function FakeDate(t = timeNow) {
  return new _Date(t);
}
FakeDate.now = () => timeNow;

beforeAll(() => {
  global.Date = FakeDate as never;
});
afterAll(() => {
  global.Date = _Date;
});

const Foo = () => null;
const Bar = () => null;

const getRegisteredResult = moxy(() => '');

beforeEach(() => {
  getRegisteredResult.mock.reset();
});

const channel = {
  platform: 'test',
  id: 12345,
  uid: 'test.12345',
} as unknown as MetaApiChannel;

const chat = {
  platform: 'test',
  target: { id: '67890' },
  uid: 'test.12345.67890',
} as MessengerChat;

describe('createChatJobs(options)(chat, segments)', () => {
  const segments: (UnitSegment<MessengerSegmentValue> | TextSegment)[] = [
    {
      type: 'unit',
      path: '?',
      node: <Foo />,
      value: {
        type: 'message',
        apiPath: PATH_MESSAGES,
        params: { sender_action: 'typing_on' },
      },
    },
    {
      type: 'unit',
      path: '?',
      node: <Foo />,
      value: {
        type: 'message',
        apiPath: PATH_MESSAGES,
        params: { message: { id: 1 } },
      },
    },
    {
      type: 'unit',
      path: '?',
      node: <Bar />,
      value: {
        type: 'message',
        apiPath: 'bar/baz',
        params: { id: 2 },
      } as never,
    },
    { type: 'text', path: '?', node: 'id:3', value: 'id:3' },
    { type: 'text', path: '?', node: 4, value: '4' },
  ];

  const expectedBodyFields = [
    { sender_action: 'typing_on' },
    { message: { id: 1 } },
    { id: 2 },
    { message: { text: 'id:3' } },
    { message: { text: '4' } },
  ];

  it('create jobs to be sent', () => {
    const jobs = createChatJobs(channel)(chat, segments);

    jobs.forEach((job, i) => {
      expect(job).toEqual({
        key: 'test.12345.67890',
        channel,
        request: {
          method: 'POST',
          url: i === 2 ? 'bar/baz' : 'me/messages',
          params: {
            recipient: { id: '67890' },
            ...expectedBodyFields[i],
          },
        },
      });
    });
  });

  test('with message metadata', () => {
    const jobs = createChatJobs(channel, {
      messagingType: 'MESSAGE_TAG',
      tag: 'PAYMENT_UPDATE',
      notificationType: 'SILENT_PUSH',
      personaId: 'your-dearest-friend',
    })(chat, segments);

    expect(jobs).toMatchSnapshot();

    jobs.forEach((job, i) => {
      if (i === 0) {
        expect(job.request.params?.messaging_type).toBe(undefined);
        expect(job.request.params?.tag).toBe(undefined);
        expect(job.request.params?.notification_type).toBe(undefined);
        expect(job.request.params?.persona_id).toBe('your-dearest-friend');
      } else if (i === 2) {
        expect(job.request.params?.messaging_type).toBe(undefined);
        expect(job.request.params?.tag).toBe(undefined);
        expect(job.request.params?.notification_type).toBe(undefined);
        expect(job.request.params?.persona_id).toBe(undefined);
      } else {
        expect(job.request.params).toEqual(
          expect.objectContaining({
            messaging_type: 'MESSAGE_TAG',
            tag: 'PAYMENT_UPDATE',
            notification_type: 'SILENT_PUSH',
            persona_id: 'your-dearest-friend',
          }),
        );
      }
    });
  });

  it('set persona_id message and typing_on/typeing_off action', () => {
    const jobs = createChatJobs(channel, { personaId: 'droid' })(chat, [
      {
        type: 'unit',
        path: '?',
        node: <Foo />,
        value: {
          type: 'message',
          apiPath: PATH_MESSAGES,
          params: { message: { text: 'hello' } },
        },
      },
      {
        type: 'unit',
        path: '?',
        node: <Foo />,
        value: {
          type: 'message',
          apiPath: PATH_MESSAGES,
          params: { sender_action: 'typing_on' },
        },
      },
      {
        type: 'unit',
        path: '?',
        node: <Foo />,
        value: {
          type: 'message',
          apiPath: PATH_MESSAGES,
          params: { sender_action: 'typing_off' },
        },
      },
      {
        type: 'unit',
        path: '?',
        node: <Foo />,
        value: {
          type: 'message',
          apiPath: PATH_MESSAGES,
          params: { sender_action: 'mark_seen' },
        },
      },
    ]);

    jobs.forEach((job, i) => {
      expect(job.request.params?.persona_id).toBe(
        i !== 3 ? 'droid' : undefined,
      );
    });
  });

  it('respect options set in job value', () => {
    const jobs = createChatJobs(channel, {
      messagingType: 'UPDATE',
      tag: undefined,
      notificationType: 'SILENT_PUSH',
      personaId: 'astromech-droid',
    })(chat, [
      {
        type: 'unit',
        path: '?',
        node: <Foo />,
        value: {
          type: 'message',
          apiPath: PATH_MESSAGES,
          params: {
            message: { text: 'bibiboo' },
            messaging_type: 'MESSAGE_TAG',
            tag: 'POST_PURCHASE_UPDATE',
          },
        },
      },
      {
        type: 'unit',
        path: '?',
        node: <Foo />,
        value: {
          type: 'message',
          apiPath: PATH_MESSAGES,
          params: {
            message: { text: 'Oh! I apologize.' },
            notification_type: 'REGULAR',
            persona_id: 'protocol-droid',
          },
        },
      },
    ]);

    expect(jobs).toMatchSnapshot();

    expect(jobs[0].request.params).toEqual({
      recipient: { id: '67890' },
      message: { text: 'bibiboo' },
      messaging_type: 'MESSAGE_TAG',
      tag: 'POST_PURCHASE_UPDATE',
      notification_type: 'SILENT_PUSH',
      persona_id: 'astromech-droid',
    });

    expect(jobs[1].request.params).toEqual({
      recipient: { id: '67890' },
      message: { text: 'Oh! I apologize.' },
      messaging_type: 'UPDATE',
      notification_type: 'REGULAR',
      persona_id: 'protocol-droid',
    });
  });

  it('respect the empty tag if messaging_type has already been set', () => {
    const jobs = createChatJobs(channel, {
      messagingType: 'MESSAGE_TAG',
      tag: 'FEATURE_FUNCTIONALITY_UPDATE',
      notificationType: 'SILENT_PUSH',
      personaId: 'astromech-droid',
    })(chat, [
      {
        type: 'unit',
        path: '?',
        node: <Foo />,
        value: {
          type: 'message',
          apiPath: PATH_MESSAGES,
          params: {
            message: { text: 'bibibooboobibooboo' },
            messaging_type: 'RESPONSE',
          },
        },
      },
    ]);

    expect(jobs).toMatchSnapshot();

    expect(jobs[0].request.params).toEqual({
      recipient: { id: '67890' },
      message: { text: 'bibibooboobibooboo' },
      messaging_type: 'RESPONSE',
      notification_type: 'SILENT_PUSH',
      persona_id: 'astromech-droid',
    });
  });

  test('use oneTimeNotifToken as recipient', () => {
    const helloSegment: UnitSegment<MessengerSegmentValue> = {
      type: 'unit',
      path: '?',
      node: <Foo />,
      value: {
        type: 'message',
        apiPath: PATH_MESSAGES,
        params: { message: { text: 'hello' } },
      },
    };

    const jobs = createChatJobs(channel, {
      oneTimeNotifToken: '__ONE_TIME_NOTIF_TOKEN__',
    })(chat, [helloSegment]);

    expect(jobs[0].request.params?.recipient).toEqual({
      one_time_notif_token: '__ONE_TIME_NOTIF_TOKEN__',
    });

    expect(() =>
      createChatJobs(channel, {
        oneTimeNotifToken: '__ONE_TIME_NOTIF_TOKEN__',
      })(chat, [
        helloSegment,
        {
          type: 'unit',
          path: '?',
          node: <Foo />,
          value: {
            type: 'message',
            apiPath: PATH_MESSAGES,
            params: { message: { text: 'world' } },
          },
        },
      ]),
    ).toThrowErrorMatchingInlineSnapshot(
      `"oneTimeNotifToken can only be used to send one message"`,
    );
  });

  it('add attached file data and info', () => {
    const jobs = createChatJobs(channel)(chat, [
      {
        type: 'unit',
        path: '?',
        node: <Foo />,
        value: {
          type: 'message',
          apiPath: PATH_MESSAGES,
          params: {
            message: { attachment: { type: 'image' } },
          },
          file: {
            data: '_FOO_',
          },
        },
      },
      {
        type: 'unit',
        path: '?',
        node: <Bar />,
        value: {
          type: 'message',
          apiPath: 'bar/baz' as never,
          params: {
            message: { attachment: { type: 'file' } },
          },
          file: {
            data: '_BAR_',
            fileName: 'deathangel.jpg',
            contentType: 'image/jpeg',
          },
          assetTag: 'BAR!',
        },
      },
    ]);

    expect(jobs).toMatchSnapshot();

    expect(jobs[0].file).toEqual({ data: '_FOO_' });
    expect(jobs[0].assetTag).toBe(undefined);
    expect(jobs[1].file).toEqual({
      data: '_BAR_',
      fileName: 'deathangel.jpg',
      contentType: 'image/jpeg',
    });
    expect(jobs[1].assetTag).toBe('BAR!');
  });
});

describe('createUploadChatAttachmentJobs()', () => {
  it('create upload job with url', () => {
    expect(
      createUploadChatAttachmentJobs()(channel, [
        {
          type: 'unit' as const,
          path: '?',
          node: <Foo />,
          value: {
            type: 'message',
            apiPath: PATH_MESSAGES,
            params: {
              message: {
                attachment: {
                  type: 'image',
                  src: 'https://sociably.io/doge.jpg',
                  is_sharable: true,
                },
              },
            },
          },
        },
      ]),
    ).toEqual([
      {
        channel,
        request: {
          method: 'POST',
          url: 'me/message_attachments',
          params: {
            message: {
              attachment: {
                type: 'image',
                src: 'https://sociably.io/doge.jpg',
                is_sharable: true,
              },
            },
          },
        },
      },
    ]);
  });

  it('create upload with file data', () => {
    const file = {
      data: '_FILE_CONTENT_DATA_',
      fileName: 'doge.jpg',
      contentType: 'image/jpeg',
    };
    const assetTag = 'MY_ASSET';

    expect(
      createUploadChatAttachmentJobs()(channel, [
        {
          type: 'unit',
          path: '?',
          node: <Foo />,
          value: {
            type: 'message',
            apiPath: PATH_MESSAGES,
            params: {
              message: {
                attachment: { type: 'image', is_sharable: true },
              },
            },
            file,
            assetTag,
          },
        },
      ]),
    ).toEqual([
      {
        channel,
        request: {
          method: 'POST',
          url: 'me/message_attachments',
          params: {
            message: {
              attachment: { type: 'image', is_sharable: true },
            },
          },
        },
        file,
        assetTag,
      },
    ]);
  });

  it('throw if multiple messages received', () => {
    const segment: UnitSegment<MessengerSegmentValue> = {
      type: 'unit',
      path: '?',
      node: <Foo />,
      value: {
        type: 'message',
        apiPath: PATH_MESSAGES,
        params: {
          message: {
            attachment: {
              type: 'image',
              src: 'https://sociably.io/you_dont_say.jpg',
              is_sharable: true,
            },
          },
        },
      },
    };

    expect(() =>
      createUploadChatAttachmentJobs()(channel, [segment, segment]),
    ).toThrowErrorMatchingInlineSnapshot(`"more than 1 message received"`);
  });

  it('throw if non media message received', () => {
    expect(() =>
      createUploadChatAttachmentJobs()(channel, [
        {
          type: 'unit',
          path: '?',
          node: <Foo />,
          value: {
            type: 'message',
            apiPath: PATH_MESSAGES,
            params: { message: { text: "I'm an attachment!" } },
          },
        },
      ]),
    ).toThrowErrorMatchingInlineSnapshot(
      `"<Foo /> is not valid attachment message"`,
    );

    expect(() =>
      createUploadChatAttachmentJobs()(channel, [
        {
          type: 'unit',
          path: '?',
          node: <Bar />,
          value: {
            type: 'message',
            apiPath: PATH_MESSAGES,
            params: {
              message: {
                attachment: {
                  type: 'template',
                  payload: {
                    /* ...... */
                  },
                },
              },
            },
          },
        },
      ]),
    ).toThrowErrorMatchingInlineSnapshot(
      `"invalid attachment type "template" to be uploaded"`,
    );
  });
});
