import moxy from 'moxy';
import Machinat from 'machinat';
import { formatElement } from 'machinat-utility';
import ChatThread from '../chat';
import {
  MESSENGER_NAITVE_TYPE,
  ATTACHED_FILE_DATA,
  ATTACHED_FILE_INFO,
} from '../../symbol';

test('with user id', () => {
  const thread = new ChatThread({ id: 'foo' });

  expect(thread.platform).toBe('messenger');
  expect(thread.type).toBe('chat');
  expect(thread.subtype).toBe('user');
  expect(thread.allowPause).toBe(true);
  expect(thread.uid()).toBe('messenger:default:user:foo');
  expect(typeof thread.createJobs).toBe('function');
});

test('with user id', () => {
  const thread = new ChatThread({ id: 'foo' });

  expect(thread.platform).toBe('messenger');
  expect(thread.type).toBe('chat');
  expect(thread.subtype).toBe('user');
  expect(thread.allowPause).toBe(true);
  expect(thread.uid()).toBe('messenger:default:user:foo');
  expect(typeof thread.createJobs).toBe('function');
});

test('with user_ref', () => {
  const thread = new ChatThread({ user_ref: 'bar' });

  expect(thread.platform).toBe('messenger');
  expect(thread.type).toBe('chat');
  expect(thread.subtype).toBe('user');
  expect(thread.allowPause).toBe(true);
  expect(thread.uid()).toBe('messenger:default:user_ref:bar');
  expect(typeof thread.createJobs).toBe('function');
});

test('with phone_number', () => {
  const thread = new ChatThread({ phone_number: '+88888888888' });

  expect(thread.platform).toBe('messenger');
  expect(thread.type).toBe('chat');
  expect(thread.subtype).toBe('user');
  expect(thread.allowPause).toBe(true);
  // the phone number is hashed to hide personal info
  expect(thread.uid()).toMatchInlineSnapshot(
    `"messenger:default:phone_number:nRn5C+EX4/vdk02aEWYs2zV5sHM="`
  );
  expect(typeof thread.createJobs).toBe('function');
});

describe('#createJobs(actions)', () => {
  const Foo = () => {};
  Foo.$$native = MESSENGER_NAITVE_TYPE;
  Foo.$$unit = true;

  const Bar = () => {};
  Bar.$$native = MESSENGER_NAITVE_TYPE;
  Bar.$$unit = true;
  Bar.$$entry = 'bar/baz';

  const actions = [
    { element: <Foo />, value: { message: { id: 1 } } },
    { element: <Bar />, value: { id: 2 } },
    { element: 'id:3', value: 'id:3' },
    { element: 4, value: '4' },
  ];

  it('create jobs to be sent', () => {
    const recipient = { id: 'john' };
    const thread = new ChatThread(recipient);

    const jobs = thread.createJobs(actions);

    expect(jobs).toMatchSnapshot();

    jobs.forEach((job, i) => {
      expect(job.threadId).toBe('messenger:default:user:john');

      expect(job.request.method).toBe('POST');
      expect(job.request.relative_url).toBe(
        i === 1 ? 'bar/baz' : 'me/messages'
      );

      expect(job.attachedFileData).toBe(undefined);
      expect(job.attachedFileInfo).toBe(undefined);

      const { body } = job.request;
      expect(body.split('&')).toEqual(
        expect.arrayContaining([
          `recipient=${encodeURIComponent('{"id":"john"}')}`,
          i === 0
            ? `message=${encodeURIComponent('{"id":1}')}`
            : i === 1
            ? 'id=2'
            : i === 2
            ? `message=${encodeURIComponent('{"text":"id:3"}')}`
            : `message=${encodeURIComponent('{"text":"4"}')}`,
        ])
      );

      expect(body).toEqual(expect.not.stringContaining('messaging_type'));
      expect(body).toEqual(expect.not.stringContaining('tag'));
      expect(body).toEqual(expect.not.stringContaining('notification_type'));
      expect(body).toEqual(expect.not.stringContaining('persona_id'));
    });
  });

  it('add coresponding options to body', () => {
    const recipient = { id: 'john' };
    const thread = new ChatThread(recipient);

    const jobs = thread.createJobs(actions, {
      messagingType: 'MESSAGE_TAG',
      tag: 'PAYMENT_UPDATE',
      notificationType: 'SILENT_PUSH',
      personaId: 'your-dearest-friend',
    });

    expect(jobs).toMatchSnapshot();

    jobs.forEach((job, i) => {
      expect(job.threadId).toBe('messenger:default:user:john');

      expect(job.request.method).toBe('POST');
      expect(job.request.relative_url).toBe(
        i === 1 ? 'bar/baz' : 'me/messages'
      );
      expect(job.attachedFileData).toBe(undefined);
      expect(job.attachedFileInfo).toBe(undefined);

      const { body } = job.request;
      expect(body.split('&')).toEqual(
        expect.arrayContaining([
          `recipient=${encodeURIComponent('{"id":"john"}')}`,
          i === 0
            ? `message=${encodeURIComponent('{"id":1}')}`
            : i === 1
            ? 'id=2'
            : i === 2
            ? `message=${encodeURIComponent('{"text":"id:3"}')}`
            : `message=${encodeURIComponent('{"text":"4"}')}`,
          'messaging_type=MESSAGE_TAG',
          'tag=PAYMENT_UPDATE',
          'notification_type=SILENT_PUSH',
          'persona_id=your-dearest-friend',
        ])
      );
    });
  });

  it('respect options originally set in action value', () => {
    const thread = new ChatThread({ id: 'Luke' });

    const jobs = thread.createJobs(
      [
        {
          element: <Foo />,
          value: {
            message: { text: 'bibiboo' },
            messaging_type: 'MESSAGE_TAG',
            tag: 'SHIPPING_UPDATE',
          },
        },
        {
          element: <Foo />,
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

    expect(jobs[0].request.body.split('&')).toEqual(
      expect.arrayContaining([
        `recipient=${encodeURIComponent('{"id":"Luke"}')}`,
        `message=${encodeURIComponent('{"text":"bibiboo"}')}`,
        'messaging_type=MESSAGE_TAG',
        'tag=SHIPPING_UPDATE',
        'notification_type=SILENT_PUSH',
        'persona_id=astromech-droid',
      ])
    );

    expect(jobs[1].request.body.split('&')).toEqual(
      expect.arrayContaining([
        `recipient=${encodeURIComponent('{"id":"Luke"}')}`,
        `message=${encodeURIComponent('{"text":"Oh! I apologize."}')}`,
        'messaging_type=UPDATE',
        'notification_type=REGULAR',
        'persona_id=protocol-droid',
      ])
    );
    expect(jobs[1].request.body).toEqual(expect.not.stringContaining('tag='));
  });

  it('respect the empty tag if messaging_type has already been set', () => {
    const thread = new ChatThread({ id: 'Luke' });

    const jobs = thread.createJobs(
      [
        {
          element: <Foo />,
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

    expect(jobs[0].request.body.split('&')).toEqual(
      expect.arrayContaining([
        `recipient=${encodeURIComponent('{"id":"Luke"}')}`,
        `message=${encodeURIComponent('{"text":"bibibooboobibooboo"}')}`,
        'messaging_type=RESPONSE',
        'notification_type=SILENT_PUSH',
        'persona_id=astromech-droid',
      ])
    );
    expect(jobs[0].request.body).toEqual(expect.not.stringContaining('tag='));
  });

  it('add attached file data and info if there are', () => {
    const thread = new ChatThread({ id: 'john' });
    const fileInfo = {
      filename: 'deathangel.jpg',
      contentType: 'image/jpeg',
      knownLength: 66666,
    };

    const jobs = thread.createJobs([
      {
        element: <Foo />,
        value: { a: 'gift', [ATTACHED_FILE_DATA]: '_DEADLY_VIRUS_' },
      },
      {
        element: <Bar />,
        value: {
          a: 'redemption',
          [ATTACHED_FILE_DATA]: '_MERCY_CURE_',
          [ATTACHED_FILE_INFO]: fileInfo,
        },
      },
    ]);

    expect(jobs).toMatchSnapshot();

    jobs.forEach((job, i) => {
      expect(job.threadId).toBe('messenger:default:user:john');

      expect(job.request.method).toBe('POST');
      expect(job.request.relative_url).toBe(
        i === 1 ? 'bar/baz' : 'me/messages'
      );

      expect(job.attachedFileData).toBe(
        i === 0 ? '_DEADLY_VIRUS_' : '_MERCY_CURE_'
      );
      expect(job.attachedFileInfo).toEqual(i === 0 ? undefined : fileInfo);

      const { body } = job.request;
      expect(body).toEqual(expect.stringContaining(`recipient=`));
      expect(body).toEqual(expect.stringContaining(`a=`));
    });
  });
});
