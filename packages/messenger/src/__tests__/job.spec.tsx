import Sociably from '@sociably/core';
import { UnitSegment, TextSegment } from '@sociably/core/renderer';
import { createChatJobs, createAttachmentJobs } from '../job';
import MessengerChat from '../Chat';
import { API_PATH, ATTACHMENT_DATA, ATTACHMENT_INFO } from '../constant';
import { MessengerSegmentValue } from '../types';

const Foo = () => null;

const Bar = () => null;

describe('createChatJobs(options)(channel, segments)', () => {
  const segments: (UnitSegment<MessengerSegmentValue> | TextSegment)[] = [
    {
      type: 'unit' as const,
      path: '?',
      node: <Foo />,
      value: { sender_action: 'typing_on' },
    },
    {
      type: 'unit' as const,
      path: '?',
      node: <Foo />,
      value: { message: { id: 1 } },
    },
    {
      type: 'unit' as const,
      path: '?',
      node: <Bar />,
      value: { id: 2, [API_PATH]: 'bar/baz' } as never,
    },
    { type: 'text' as const, path: '?', node: 'id:3', value: 'id:3' },
    { type: 'text' as const, path: '?', node: 4, value: '4' },
  ];

  const expectedBodyFields = [
    { sender_action: 'typing_on' },
    { message: { id: 1 } },
    { id: 2 },
    { message: { text: 'id:3' } },
    { message: { text: '4' } },
  ];

  it('create jobs to be sent', () => {
    const channel = new MessengerChat('12345', '67890');

    const jobs = createChatJobs()(channel, segments);

    jobs.forEach((job, i) => {
      expect(job).toEqual({
        key: 'facebook.12345.67890',
        request: {
          method: 'POST',
          relative_url: i === 2 ? 'bar/baz' : 'me/messages',
          body: {
            recipient: { id: '67890' },
            ...expectedBodyFields[i],
          },
        },
      });
    });
  });

  test('with message metadata', () => {
    const channel = new MessengerChat('12345', '67890');

    const jobs = createChatJobs({
      messagingType: 'MESSAGE_TAG',
      tag: 'PAYMENT_UPDATE',
      notificationType: 'SILENT_PUSH',
      personaId: 'your-dearest-friend',
    })(channel, segments);

    expect(jobs).toMatchSnapshot();

    jobs.forEach((job, i) => {
      if (i === 0) {
        expect(job.request.body.messaging_type).toBe(undefined);
        expect(job.request.body.tag).toBe(undefined);
        expect(job.request.body.notification_type).toBe(undefined);
        expect(job.request.body.persona_id).toBe('your-dearest-friend');
      } else if (i === 2) {
        expect(job.request.body.messaging_type).toBe(undefined);
        expect(job.request.body.tag).toBe(undefined);
        expect(job.request.body.notification_type).toBe(undefined);
        expect(job.request.body.persona_id).toBe(undefined);
      } else {
        expect(job.request.body).toEqual(
          expect.objectContaining({
            messaging_type: 'MESSAGE_TAG',
            tag: 'PAYMENT_UPDATE',
            notification_type: 'SILENT_PUSH',
            persona_id: 'your-dearest-friend',
          })
        );
      }
    });
  });

  it('set persona_id message and typing_on/typeing_off action', () => {
    const channel = new MessengerChat('12345', '67890');

    const jobs = createChatJobs({ personaId: 'droid' })(channel, [
      {
        type: 'unit',
        path: '?',
        node: <Foo />,
        value: { message: { text: 'hello' } },
      },
      {
        type: 'unit',
        path: '?',
        node: <Foo />,
        value: { sender_action: 'typing_on' },
      },
      {
        type: 'unit',
        path: '?',
        node: <Foo />,
        value: { sender_action: 'typing_off' },
      },
      {
        type: 'unit',
        path: '?',
        node: <Foo />,
        value: { sender_action: 'mark_seen' },
      },
    ]);

    jobs.forEach((job, i) => {
      expect(job.request.body.persona_id).toBe(i !== 3 ? 'droid' : undefined);
    });
  });

  it('respect options originally set in job value', () => {
    const channel = new MessengerChat('12345', '67890');

    const jobs = createChatJobs({
      messagingType: 'UPDATE',
      tag: undefined,
      notificationType: 'SILENT_PUSH',
      personaId: 'astromech-droid',
    })(channel, [
      {
        type: 'unit',
        path: '?',
        node: <Foo />,
        value: {
          message: { text: 'bibiboo' },
          messaging_type: 'MESSAGE_TAG',
          tag: 'POST_PURCHASE_UPDATE',
        },
      },
      {
        type: 'unit',
        path: '?',
        node: <Foo />,
        value: {
          message: { text: 'Oh! I apologize.' },
          notification_type: 'REGULAR',
          persona_id: 'protocol-droid',
        },
      },
    ]);

    expect(jobs).toMatchSnapshot();

    expect(jobs[0].request.body).toEqual({
      recipient: { id: '67890' },
      message: { text: 'bibiboo' },
      messaging_type: 'MESSAGE_TAG',
      tag: 'POST_PURCHASE_UPDATE',
      notification_type: 'SILENT_PUSH',
      persona_id: 'astromech-droid',
    });

    expect(jobs[1].request.body).toEqual({
      recipient: { id: '67890' },
      message: { text: 'Oh! I apologize.' },
      messaging_type: 'UPDATE',
      notification_type: 'REGULAR',
      persona_id: 'protocol-droid',
    });
  });

  it('respect the empty tag if messaging_type has already been set', () => {
    const channel = new MessengerChat('12345', '67890');

    const jobs = createChatJobs({
      messagingType: 'MESSAGE_TAG',
      tag: 'FEATURE_FUNCTIONALITY_UPDATE',
      notificationType: 'SILENT_PUSH',
      personaId: 'astromech-droid',
    })(channel, [
      {
        type: 'unit',
        path: '?',
        node: <Foo />,
        value: {
          message: { text: 'bibibooboobibooboo' },
          messaging_type: 'RESPONSE',
        },
      },
    ]);

    expect(jobs).toMatchSnapshot();

    expect(jobs[0].request.body).toEqual({
      recipient: { id: '67890' },
      message: { text: 'bibibooboobibooboo' },
      messaging_type: 'RESPONSE',
      notification_type: 'SILENT_PUSH',
      persona_id: 'astromech-droid',
    });
  });

  test('use oneTimeNotifToken as recipient', () => {
    const channel = new MessengerChat('12345', '67890');
    const helloJob = {
      type: 'unit' as const,
      path: '?',
      node: <Foo />,
      value: { message: { text: 'hello' } },
    };

    const jobs = createChatJobs({
      oneTimeNotifToken: '__ONE_TIME_NOTIF_TOKEN__',
    })(channel, [helloJob]);

    expect(jobs[0].request.body.recipient).toEqual({
      one_time_notif_token: '__ONE_TIME_NOTIF_TOKEN__',
    });

    expect(() =>
      createChatJobs({
        oneTimeNotifToken: '__ONE_TIME_NOTIF_TOKEN__',
      })(channel, [
        helloJob,
        {
          type: 'unit',
          path: '?',
          node: <Foo />,
          value: { message: { text: 'world' } },
        },
      ])
    ).toThrowErrorMatchingInlineSnapshot(
      `"oneTimeNotifToken can only be used to send one message"`
    );
  });

  it('add attached file data and info if there are', () => {
    const channel = new MessengerChat('12345', '67890');
    const fileInfo = {
      filename: 'deathangel.jpg',
      contentType: 'image/jpeg',
      knownLength: 66666,
    };

    const jobs = createChatJobs()(channel, [
      {
        type: 'unit',
        path: '?',
        node: <Foo />,
        value: {
          message: { attachment: { type: 'image' } },
          [ATTACHMENT_DATA]: '_FOO_',
        },
      },
      {
        type: 'unit',
        path: '?',
        node: <Bar />,
        value: {
          message: { attachment: { type: 'file' } },
          [API_PATH]: 'bar/baz',
          [ATTACHMENT_DATA]: '_BAR_',
          [ATTACHMENT_INFO]: fileInfo,
        },
      },
    ]);

    expect(jobs).toMatchSnapshot();

    jobs.forEach((job, i) => {
      expect(job.fileData).toBe(i === 0 ? '_FOO_' : '_BAR_');

      expect(job.fileInfo).toEqual(i === 0 ? undefined : fileInfo);
    });
  });
});

describe('createAttachmentJobs()', () => {
  it('work with attachment url', () => {
    expect(
      createAttachmentJobs(null, [
        {
          type: 'unit' as const,
          path: '?',
          node: <Foo />,
          value: {
            message: {
              attachment: {
                type: 'image',
                src: 'https://sociably.io/doge.jpg',
                is_sharable: true,
              },
            },
          },
        },
      ])
    ).toEqual([
      {
        request: {
          method: 'POST',
          relative_url: 'me/message_attachments',
          body: {
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

  it('work with file data', () => {
    const fileInfo = {
      filename: 'doge.jpg',
      contentType: 'image/jpeg',
      knownLength: 12345,
    };

    expect(
      createAttachmentJobs(null, [
        {
          type: 'unit',
          path: '?',
          node: <Foo />,
          value: {
            message: {
              attachment: { type: 'image', is_sharable: true },
            },
            [ATTACHMENT_DATA]: '_FILE_CONTENT_DATA_',
            [ATTACHMENT_INFO]: fileInfo,
          },
        },
      ])
    ).toEqual([
      {
        fileData: '_FILE_CONTENT_DATA_',
        fileInfo,
        request: {
          method: 'POST',
          relative_url: 'me/message_attachments',
          body: {
            message: {
              attachment: { type: 'image', is_sharable: true },
            },
          },
        },
      },
    ]);
  });

  it('throw if multiple messages passed', () => {
    const segment = {
      type: 'unit' as const,
      path: '?',
      node: <Foo />,
      value: {
        message: {
          attachment: {
            type: 'image',
            src: 'https://sociably.io/you_dont_say.jpg',
            is_sharable: true,
          },
        },
      },
    };

    expect(() =>
      createAttachmentJobs(null, [segment, segment])
    ).toThrowErrorMatchingInlineSnapshot(`"more than 1 message received"`);
  });

  it('throw if non media message passed', () => {
    expect(() =>
      createAttachmentJobs(null, [
        {
          type: 'unit' as const,
          path: '?',
          node: <Foo />,
          value: {
            message: { text: "I'm an attachment!" },
          },
        },
      ])
    ).toThrowErrorMatchingInlineSnapshot(
      `"non attachment message <Foo /> received"`
    );

    expect(() =>
      createAttachmentJobs(null, [
        {
          type: 'unit',
          path: '?',
          node: <Bar />,
          value: {
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
      ])
    ).toThrowErrorMatchingInlineSnapshot(
      `"invalid attachment type \\"template\\" to be uploaded"`
    );
  });
});
