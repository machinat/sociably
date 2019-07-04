import Machinat from 'machinat';
import { createChatJobs, createCreativeJobs } from '../job';
import MessengerChannel from '../channel';
import {
  MESSENGER_NATIVE_TYPE,
  ATTACHED_FILE_DATA,
  ATTACHED_FILE_INFO,
} from '../constant';

const Foo = () => {};
Foo.$$native = MESSENGER_NATIVE_TYPE;
Foo.$$unit = true;
Foo.$$entry = 'me/messages';

const Bar = () => {};
Bar.$$native = MESSENGER_NATIVE_TYPE;
Bar.$$unit = true;
Bar.$$entry = 'bar/baz';

describe('createChatJobs()', () => {
  const segments = [
    { node: <Foo />, value: { sender_action: 'typing_on' } },
    { node: <Foo />, value: { message: { id: 1 } } },
    { node: <Bar />, value: { id: 2 } },
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
    const channel = new MessengerChannel({ id: 'john' });

    const jobs = createChatJobs(channel, segments);

    expect(jobs).toMatchSnapshot();

    jobs.forEach((job, i) => {
      expect(job).toEqual({
        channelUid: 'messenger:default:user:john',
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

  it('add coresponding options to body on message only', () => {
    const channel = new MessengerChannel({ id: 'john' });

    const jobs = createChatJobs(channel, segments, {
      messagingType: 'MESSAGE_TAG',
      tag: 'PAYMENT_UPDATE',
      notificationType: 'SILENT_PUSH',
      personaId: 'your-dearest-friend',
    });

    expect(jobs).toMatchSnapshot();

    const expectedAttributes = {
      messaging_type: 'MESSAGE_TAG',
      tag: 'PAYMENT_UPDATE',
      notification_type: 'SILENT_PUSH',
      persona_id: 'your-dearest-friend',
    };

    jobs.forEach((job, i) => {
      const expectedBody = {
        recipient: { id: 'john' },
        ...expectedBodyFields[i],
      };

      if (i !== 0 && i !== 2) {
        Object.assign(expectedBody, expectedAttributes);
      }

      expect(job).toEqual({
        channelUid: 'messenger:default:user:john',
        request: {
          method: 'POST',
          relative_url: i === 2 ? 'bar/baz' : 'me/messages',
          body: expectedBody,
        },
      });
    });
  });

  it('respect options originally set in job value', () => {
    const channel = new MessengerChannel({ id: 'Luke' });

    const jobs = createChatJobs(
      channel,
      [
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
      ],
      {
        messagingType: 'UPDATE',
        tag: undefined,
        notificationType: 'SILENT_PUSH',
        personaId: 'astromech-droid',
      }
    );

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
    const channel = new MessengerChannel({ id: 'Luke' });

    const jobs = createChatJobs(
      channel,
      [
        {
          node: <Foo />,
          value: {
            message: { text: 'bibibooboobibooboo' },
            messaging_type: 'RESPONSE',
          },
        },
      ],
      {
        messagingType: 'MESSAGE_TAG',
        tag: 'FEATURE_FUNCTIONALITY_UPDATE',
        notificationType: 'SILENT_PUSH',
        personaId: 'astromech-droid',
      }
    );

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
    const channel = new MessengerChannel({ id: 'john' });
    const fileInfo = {
      filename: 'deathangel.jpg',
      contentType: 'image/jpeg',
      knownLength: 66666,
    };

    const jobs = createChatJobs(channel, [
      {
        node: <Foo />,
        value: { a: 'gift', [ATTACHED_FILE_DATA]: '_DEADLY_VIRUS_' },
      },
      {
        node: <Bar />,
        value: {
          a: 'redemption',
          [ATTACHED_FILE_DATA]: '_MERCY_CURE_',
          [ATTACHED_FILE_INFO]: fileInfo,
        },
      },
    ]);

    expect(jobs).toMatchSnapshot();

    jobs.forEach((job, i) => {
      expect(job.attachedFileData).toBe(
        i === 0 ? '_DEADLY_VIRUS_' : '_MERCY_CURE_'
      );

      expect(job.attachedFileInfo).toEqual(i === 0 ? undefined : fileInfo);
    });
  });
});

describe('createCreativeJobs()', () => {
  const segments = [
    { element: <Foo />, value: { message: { id: 1 } } },
    { element: 2, value: '2' },
    { element: 'id:3', value: 'id:3' },
  ];

  it('create jobs to be sent to messenge_creative', () => {
    expect(createCreativeJobs(null, segments)).toEqual([
      {
        request: {
          method: 'POST',
          relative_url: 'me/message_creatives',
          body: { messages: [{ id: 1 }, { text: '2' }, { text: 'id:3' }] },
        },
      },
    ]);
  });

  it('throw if non messages element met', () => {
    [
      [<Bar />, {}, '<Bar />'],
      [<Foo />, { i: 'am not a message' }, '<Foo />'],
      [undefined, { neither: 'am i' }, '[object Object]'],
    ].forEach(([node, value, formated]) => {
      expect(() =>
        createCreativeJobs(null, [
          ...segments.slice(0, 2),
          { node, value },
          segments[2],
        ])
      ).toThrow(`${formated} is unable to be delivered in message_creatives`);
    });
  });
});
