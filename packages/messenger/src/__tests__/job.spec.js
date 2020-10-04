import Machinat from '@machinat/core';
import { chatJobsMaker, makeAttachmentJobs } from '../job';
import MessengerChannel from '../channel';
import { API_PATH, ATTACHMENT_DATA, ATTACHMENT_INFO } from '../constant';

const Foo = () => {};

const Bar = () => {};

describe('chatJobsMaker(options)(channel, segments)', () => {
  const segments = [
    { node: <Foo />, value: { sender_action: 'typing_on' } },
    { node: <Foo />, value: { message: { id: 1 } } },
    { node: <Bar />, value: { id: 2, [API_PATH]: 'bar/baz' } },
    { node: 'id:3', value: 'id:3' },
    { node: 4, value: '4' },
  ];

  const expectedBodyFields = [
    { sender_action: 'typing_on' },
    { message: { id: 1 } },
    { id: 2 },
    { message: { text: 'id:3' } },
    { message: { text: '4' } },
  ];

  it('create jobs to be sent', () => {
    const channel = new MessengerChannel('_PAGE_ID_', { id: 'john' });

    const jobs = chatJobsMaker()(channel, segments);

    jobs.forEach((job, i) => {
      expect(job).toEqual({
        channelUId: 'messenger._PAGE_ID_.psid.john',
        request: {
          method: 'POST',
          relative_url: i === 2 ? 'bar/baz' : 'me/messages',
          body: {
            recipient: { id: 'john' },
            ...expectedBodyFields[i],
          },
        },
      });
    });
  });

  it('add coresponding options to body on messages', () => {
    const channel = new MessengerChannel('_PAGE_ID_', { id: 'john' });

    const jobs = chatJobsMaker({
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
    const channel = new MessengerChannel('_PAGE_ID_', { id: 'john' });

    const jobs = chatJobsMaker({ personaId: 'droid' })(channel, [
      { node: <Foo />, value: { message: { text: 'hello' } } },
      { node: <Foo />, value: { sender_action: 'typing_on' } },
      { node: <Foo />, value: { sender_action: 'typing_off' } },
      { node: <Foo />, value: { sender_action: 'mark_seen' } },
    ]);

    jobs.forEach((job, i) => {
      expect(job.request.body.persona_id).toBe(i !== 3 ? 'droid' : undefined);
    });
  });

  it('respect options originally set in job value', () => {
    const channel = new MessengerChannel('_PAGE_ID_', { id: 'Luke' });

    const jobs = chatJobsMaker({
      messagingType: 'UPDATE',
      tag: undefined,
      notificationType: 'SILENT_PUSH',
      personaId: 'astromech-droid',
    })(channel, [
      {
        node: <Foo />,
        value: {
          message: { text: 'bibiboo' },
          messaging_type: 'MESSAGE_TAG',
          tag: 'SHIPPING_UPDATE',
        },
      },
      {
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
      recipient: { id: 'Luke' },
      message: { text: 'bibiboo' },
      messaging_type: 'MESSAGE_TAG',
      tag: 'SHIPPING_UPDATE',
      notification_type: 'SILENT_PUSH',
      persona_id: 'astromech-droid',
    });

    expect(jobs[1].request.body).toEqual({
      recipient: { id: 'Luke' },
      message: { text: 'Oh! I apologize.' },
      messaging_type: 'UPDATE',
      notification_type: 'REGULAR',
      persona_id: 'protocol-droid',
    });
  });

  it('respect the empty tag if messaging_type has already been set', () => {
    const channel = new MessengerChannel('_PAGE_ID_', { id: 'Luke' });

    const jobs = chatJobsMaker({
      messagingType: 'MESSAGE_TAG',
      tag: 'FEATURE_FUNCTIONALITY_UPDATE',
      notificationType: 'SILENT_PUSH',
      personaId: 'astromech-droid',
    })(channel, [
      {
        node: <Foo />,
        value: {
          message: { text: 'bibibooboobibooboo' },
          messaging_type: 'RESPONSE',
        },
      },
    ]);

    expect(jobs).toMatchSnapshot();

    expect(jobs[0].request.body).toEqual({
      recipient: { id: 'Luke' },
      message: { text: 'bibibooboobibooboo' },
      messaging_type: 'RESPONSE',
      notification_type: 'SILENT_PUSH',
      persona_id: 'astromech-droid',
    });
  });

  it('add attached file data and info if there are', () => {
    const channel = new MessengerChannel('_PAGE_ID_', { id: 'john' });
    const fileInfo = {
      filename: 'deathangel.jpg',
      contentType: 'image/jpeg',
      knownLength: 66666,
    };

    const jobs = chatJobsMaker()(channel, [
      {
        node: <Foo />,
        value: { a: 'gift', [ATTACHMENT_DATA]: '_DEADLY_VIRUS_' },
      },
      {
        node: <Bar />,
        value: {
          a: 'redemption',
          [API_PATH]: 'bar/baz',
          [ATTACHMENT_DATA]: '_MERCY_CURE_',
          [ATTACHMENT_INFO]: fileInfo,
        },
      },
    ]);

    expect(jobs).toMatchSnapshot();

    jobs.forEach((job, i) => {
      expect(job.attachmentFileData).toBe(
        i === 0 ? '_DEADLY_VIRUS_' : '_MERCY_CURE_'
      );

      expect(job.attachmentFileInfo).toEqual(i === 0 ? undefined : fileInfo);
    });
  });

  it('throw if non USER_TO_PAGE channel met', () => {
    expect(() =>
      chatJobsMaker()(
        new MessengerChannel('_PAGE_ID_', { id: 'xxx' }, 'GROUP'),
        segments
      )
    ).toThrowErrorMatchingInlineSnapshot(`"unable to send to GROUP channel"`);

    expect(() =>
      chatJobsMaker({})(
        new MessengerChannel('_PAGE_ID_', { id: 'xxx' }, 'USER_TO_USER'),
        segments
      )
    ).toThrowErrorMatchingInlineSnapshot(
      `"unable to send to USER_TO_USER channel"`
    );
  });
});

describe('makeAttachmentJobs()', () => {
  it('work with attachment url', () => {
    expect(
      makeAttachmentJobs(null, [
        {
          type: 'unit',
          node: <Foo />,
          value: {
            message: {
              attachment: {
                type: 'image',
                src: 'https://machinat.com/doge.jpg',
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
                src: 'https://machinat.com/doge.jpg',
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
      makeAttachmentJobs(null, [
        {
          type: 'unit',
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
        attachmentFileData: '_FILE_CONTENT_DATA_',
        attachmentFileInfo: fileInfo,
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
    const cage = {
      type: 'unit',
      node: <Foo />,
      value: {
        message: {
          attachment: {
            type: 'image',
            src: 'https://machinat.com/you_dont_say.jpg',
            is_sharable: true,
          },
        },
      },
    };

    expect(() =>
      makeAttachmentJobs(null, [cage, cage])
    ).toThrowErrorMatchingInlineSnapshot(`"more than 1 message received"`);
  });

  it('throw if non media message passed', () => {
    expect(() =>
      makeAttachmentJobs(null, [
        {
          type: 'unit',
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
      makeAttachmentJobs(null, [
        {
          type: 'unit',
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