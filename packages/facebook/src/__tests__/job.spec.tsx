import moxy from '@moxyjs/moxy';
import Sociably from '@sociably/core';
import { UnitSegment, TextSegment } from '@sociably/core/renderer';
import {
  createChatJobs,
  createChatAttachmentJobs,
  createPostJobs,
  createInteractJobs,
} from '../job';
import { PATH_MESSAGES, PATH_FEED, PATH_PHOTOS } from '../constant';
import FacebookChat from '../Chat';
import FacebookPage from '../Page';
import FacebookInteractTarget from '../InteractTarget';
import { FacebookSegmentValue, PagePhotoValue, PagePostValue } from '../types';

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

describe('createChatJobs(options)(thread, segments)', () => {
  const segments: (UnitSegment<FacebookSegmentValue> | TextSegment)[] = [
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
    const thread = new FacebookChat('12345', { id: '67890' });

    const jobs = createChatJobs()(thread, segments);

    jobs.forEach((job, i) => {
      expect(job).toEqual({
        key: 'fb.12345.67890',
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
    const thread = new FacebookChat('12345', { id: '67890' });

    const jobs = createChatJobs({
      messagingType: 'MESSAGE_TAG',
      tag: 'PAYMENT_UPDATE',
      notificationType: 'SILENT_PUSH',
      personaId: 'your-dearest-friend',
    })(thread, segments);

    expect(jobs).toMatchSnapshot();

    jobs.forEach((job, i) => {
      if (i === 0) {
        expect(job.request.body?.messaging_type).toBe(undefined);
        expect(job.request.body?.tag).toBe(undefined);
        expect(job.request.body?.notification_type).toBe(undefined);
        expect(job.request.body?.persona_id).toBe('your-dearest-friend');
      } else if (i === 2) {
        expect(job.request.body?.messaging_type).toBe(undefined);
        expect(job.request.body?.tag).toBe(undefined);
        expect(job.request.body?.notification_type).toBe(undefined);
        expect(job.request.body?.persona_id).toBe(undefined);
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
    const thread = new FacebookChat('12345', { id: '67890' });

    const jobs = createChatJobs({ personaId: 'droid' })(thread, [
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
      expect(job.request.body?.persona_id).toBe(i !== 3 ? 'droid' : undefined);
    });
  });

  it('respect options set in job value', () => {
    const thread = new FacebookChat('12345', { id: '67890' });

    const jobs = createChatJobs({
      messagingType: 'UPDATE',
      tag: undefined,
      notificationType: 'SILENT_PUSH',
      personaId: 'astromech-droid',
    })(thread, [
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
    const thread = new FacebookChat('12345', { id: '67890' });

    const jobs = createChatJobs({
      messagingType: 'MESSAGE_TAG',
      tag: 'FEATURE_FUNCTIONALITY_UPDATE',
      notificationType: 'SILENT_PUSH',
      personaId: 'astromech-droid',
    })(thread, [
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

    expect(jobs[0].request.body).toEqual({
      recipient: { id: '67890' },
      message: { text: 'bibibooboobibooboo' },
      messaging_type: 'RESPONSE',
      notification_type: 'SILENT_PUSH',
      persona_id: 'astromech-droid',
    });
  });

  test('use oneTimeNotifToken as recipient', () => {
    const thread = new FacebookChat('12345', { id: '67890' });
    const helloSegment: UnitSegment<FacebookSegmentValue> = {
      type: 'unit',
      path: '?',
      node: <Foo />,
      value: {
        type: 'message',
        apiPath: PATH_MESSAGES,
        params: { message: { text: 'hello' } },
      },
    };

    const jobs = createChatJobs({
      oneTimeNotifToken: '__ONE_TIME_NOTIF_TOKEN__',
    })(thread, [helloSegment]);

    expect(jobs[0].request.body?.recipient).toEqual({
      one_time_notif_token: '__ONE_TIME_NOTIF_TOKEN__',
    });

    expect(() =>
      createChatJobs({
        oneTimeNotifToken: '__ONE_TIME_NOTIF_TOKEN__',
      })(thread, [
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
      ])
    ).toThrowErrorMatchingInlineSnapshot(
      `"oneTimeNotifToken can only be used to send one message"`
    );
  });

  it('add attached file data and info', () => {
    const thread = new FacebookChat('12345', { id: '67890' });
    const fileInfo = {
      filename: 'deathangel.jpg',
      contentType: 'image/jpeg',
      knownLength: 66666,
    };

    const jobs = createChatJobs()(thread, [
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
          attachFile: {
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
          attachFile: {
            data: '_BAR_',
            info: fileInfo,
          },
          assetTag: 'BAR!',
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

describe('createChatAttachmentJobs()', () => {
  const page = new FacebookPage('1234567890');

  it('create upload job with url', () => {
    expect(
      createChatAttachmentJobs(page, [
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

  it('create upload with file data', () => {
    const fileInfo = {
      filename: 'doge.jpg',
      contentType: 'image/jpeg',
      knownLength: 12345,
    };
    const assetTag = 'MY_ASSET';
    const fileData = '_FILE_CONTENT_DATA_';

    expect(
      createChatAttachmentJobs(page, [
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
            attachFile: {
              data: fileData,
              info: fileInfo,
            },
            assetTag,
          },
        },
      ])
    ).toEqual([
      {
        fileData,
        fileInfo,
        assetTag,
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

  it('throw if multiple messages received', () => {
    const segment: UnitSegment<FacebookSegmentValue> = {
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
      createChatAttachmentJobs(page, [segment, segment])
    ).toThrowErrorMatchingInlineSnapshot(`"more than 1 message received"`);
  });

  it('throw if non media message received', () => {
    expect(() =>
      createChatAttachmentJobs(page, [
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
      ])
    ).toThrowErrorMatchingInlineSnapshot(
      `"<Foo /> is not valid attachment message"`
    );

    expect(() =>
      createChatAttachmentJobs(page, [
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
      ])
    ).toThrowErrorMatchingInlineSnapshot(
      `"invalid attachment type \\"template\\" to be uploaded"`
    );
  });
});

describe('createPostJobs()', () => {
  const page = new FacebookPage('1234567890');

  it('create page post from text', () => {
    expect(
      createPostJobs(page, [
        {
          type: 'text',
          path: '?',
          node: <Foo />,
          value: 'hello facebook',
        },
      ])
    ).toMatchInlineSnapshot(`
      Array [
        Object {
          "request": Object {
            "body": Object {
              "message": "hello facebook",
            },
            "method": "POST",
            "relative_url": "me/feed",
          },
        },
      ]
    `);
  });

  it('create page post from unit segment', () => {
    expect(
      createPostJobs(page, [
        {
          type: 'unit',
          path: '?',
          node: <Foo />,
          value: {
            type: 'page',
            apiPath: PATH_FEED,
            params: {
              object_attachment: '1234567890',
            },
          },
        },
      ])
    ).toMatchInlineSnapshot(`
      Array [
        Object {
          "assetTag": undefined,
          "fileData": undefined,
          "fileInfo": undefined,
          "request": Object {
            "body": Object {
              "object_attachment": "1234567890",
            },
            "method": "POST",
            "relative_url": "me/feed",
          },
        },
      ]
    `);
  });

  it('create page post with link thumbnail file', () => {
    expect(
      createPostJobs(page, [
        {
          type: 'unit',
          path: '?',
          node: <Foo />,
          value: {
            type: 'page',
            apiPath: PATH_FEED,
            params: {
              link: 'http://sociably.js.org',
              name: 'Sociably',
              description: 'The social media framework',
            },
            attachFile: {
              data: Buffer.from('thumb'),
            },
          },
        },
      ])
    ).toMatchInlineSnapshot(`
      Array [
        Object {
          "assetTag": undefined,
          "fileData": Object {
            "data": Array [
              116,
              104,
              117,
              109,
              98,
            ],
            "type": "Buffer",
          },
          "fileInfo": undefined,
          "request": Object {
            "body": Object {
              "description": "The social media framework",
              "link": "http://sociably.js.org",
              "name": "Sociably",
            },
            "method": "POST",
            "relative_url": "me/feed",
          },
        },
      ]
    `);
  });

  it('create page photo from a file', () => {
    expect(
      createPostJobs(page, [
        {
          type: 'unit' as const,
          path: '?',
          node: <Foo />,
          value: {
            type: 'page',
            apiPath: PATH_PHOTOS,
            params: {},
            attachFile: {
              data: Buffer.from('foo'),
            },
          },
        },
      ])
    ).toMatchInlineSnapshot(`
      Array [
        Object {
          "assetTag": undefined,
          "fileData": Object {
            "data": Array [
              102,
              111,
              111,
            ],
            "type": "Buffer",
          },
          "fileInfo": undefined,
          "request": Object {
            "body": Object {},
            "method": "POST",
            "relative_url": "me/photos",
          },
        },
      ]
    `);
  });

  it('craete photo on an album', () => {
    const album = new FacebookInteractTarget(
      '1234567890',
      '9876543210',
      'album'
    );
    expect(
      createPostJobs(album, [
        {
          type: 'unit' as const,
          path: '?',
          node: <Foo />,
          value: {
            type: 'page',
            apiPath: PATH_PHOTOS,
            params: {
              url: 'http://foo.bar/baz.jpg',
            },
          },
        },
      ])
    ).toMatchInlineSnapshot(`
      Array [
        Object {
          "assetTag": undefined,
          "fileData": undefined,
          "fileInfo": undefined,
          "request": Object {
            "body": Object {
              "url": "http://foo.bar/baz.jpg",
            },
            "method": "POST",
            "relative_url": "9876543210/photos",
          },
        },
      ]
    `);
  });

  it('create page post job with photos', () => {
    const photos: PagePhotoValue[] = [
      {
        type: 'page',
        apiPath: PATH_PHOTOS,
        params: {
          url: 'http://sociably.com/foo.jpg',
        },
      },
      {
        type: 'page',
        apiPath: PATH_PHOTOS,
        params: {},
        attachFile: {
          data: Buffer.from('bar'),
        },
      },
    ];
    const postSegmentValue: PagePostValue = {
      type: 'page',
      apiPath: PATH_FEED,
      params: {
        message: 'foo',
      },
      photos,
    };
    const jobs = createPostJobs(page, [
      {
        type: 'unit' as const,
        path: '?',
        node: <Foo />,
        value: postSegmentValue,
      },
    ]);
    expect(jobs).toMatchInlineSnapshot(`
      Array [
        Object {
          "assetTag": undefined,
          "fileData": undefined,
          "fileInfo": undefined,
          "registerResult": "l9v0s5g4-0",
          "request": Object {
            "body": Object {
              "published": false,
              "temporary": undefined,
              "url": "http://sociably.com/foo.jpg",
            },
            "method": "POST",
            "relative_url": "me/photos",
          },
        },
        Object {
          "assetTag": undefined,
          "fileData": Object {
            "data": Array [
              98,
              97,
              114,
            ],
            "type": "Buffer",
          },
          "fileInfo": undefined,
          "registerResult": "l9v0s5g4-1",
          "request": Object {
            "body": Object {
              "published": false,
              "temporary": undefined,
            },
            "method": "POST",
            "relative_url": "me/photos",
          },
        },
        Object {
          "assetTag": undefined,
          "consumeResult": Object {
            "accomplishRequest": [Function],
            "keys": Array [
              "l9v0s5g4-0",
              "l9v0s5g4-1",
            ],
          },
          "fileData": undefined,
          "fileInfo": undefined,
          "request": Object {
            "body": Object {
              "message": "foo",
            },
            "method": "POST",
            "relative_url": "me/feed",
          },
        },
      ]
    `);

    getRegisteredResult.mock.fakeReturnValueOnce('_PHOTO_ID_1_');
    getRegisteredResult.mock.fakeReturnValueOnce('_PHOTO_ID_2_');

    const cunsumingPhotoResults = jobs[2].consumeResult;
    expect(cunsumingPhotoResults?.keys).toContain(jobs[0].registerResult);
    expect(cunsumingPhotoResults?.keys).toContain(jobs[1].registerResult);
    expect(
      cunsumingPhotoResults?.accomplishRequest(
        jobs[2].request,
        ['key1', 'key2'],
        getRegisteredResult
      )
    ).toMatchInlineSnapshot(`
      Object {
        "body": Object {
          "attached_media": Array [
            Object {
              "media_fbid": "_PHOTO_ID_1_",
            },
            Object {
              "media_fbid": "_PHOTO_ID_2_",
            },
          ],
          "message": "foo",
        },
        "method": "POST",
        "relative_url": "me/feed",
      }
    `);

    expect(getRegisteredResult).toHaveBeenCalledTimes(2);
    expect(getRegisteredResult).toHaveBeenCalledWith('key1', '$.id');
    expect(getRegisteredResult).toHaveBeenCalledWith('key2', '$.id');
  });

  it('create scheduled page post job with photos', () => {
    expect(
      createPostJobs(page, [
        {
          type: 'unit' as const,
          path: '?',
          node: <Foo />,
          value: {
            type: 'page',
            apiPath: PATH_FEED,
            params: { message: 'foo', scheduled_publish_time: 1666666666 },
            photos: [
              {
                type: 'page',
                apiPath: PATH_PHOTOS,
                params: { url: 'http://sociably.com/foo.jpg' },
              },
            ],
          },
        },
      ])
    ).toMatchInlineSnapshot(`
      Array [
        Object {
          "assetTag": undefined,
          "fileData": undefined,
          "fileInfo": undefined,
          "registerResult": "l9v0s5g4-2",
          "request": Object {
            "body": Object {
              "published": false,
              "temporary": true,
              "url": "http://sociably.com/foo.jpg",
            },
            "method": "POST",
            "relative_url": "me/photos",
          },
        },
        Object {
          "assetTag": undefined,
          "consumeResult": Object {
            "accomplishRequest": [Function],
            "keys": Array [
              "l9v0s5g4-2",
            ],
          },
          "fileData": undefined,
          "fileInfo": undefined,
          "request": Object {
            "body": Object {
              "message": "foo",
              "scheduled_publish_time": 1666666666,
            },
            "method": "POST",
            "relative_url": "me/feed",
          },
        },
      ]
    `);
  });

  it('throw if non feed value received', () => {
    expect(() =>
      createPostJobs(page, [
        {
          type: 'unit',
          path: '?',
          node: <Foo />,
          value: {
            type: 'message',
            apiPath: 'me/messages',
            params: { message: { text: 'foo' } },
          },
        },
      ])
    ).toThrowErrorMatchingInlineSnapshot(`"invalid feed element <Foo />"`);
    expect(() =>
      createPostJobs(page, [
        {
          type: 'unit',
          path: '?',
          node: <Foo />,
          value: {
            type: 'comment',
            params: { message: 'foo' },
          },
        },
      ])
    ).toThrowErrorMatchingInlineSnapshot(`"invalid feed element <Foo />"`);
  });

  it('throw if video value received, which is not supported yet', () => {
    expect(() =>
      createPostJobs(page, [
        {
          type: 'unit',
          path: '?',
          node: <Foo />,
          value: {
            type: 'page',
            apiPath: 'me/videos',
            params: { message: 'foo' },
          },
        },
      ])
    ).toThrowErrorMatchingInlineSnapshot(`"invalid feed element <Foo />"`);
  });
});

describe('createInteractJobs()', () => {
  const commentTarget = new FacebookInteractTarget('_PAGE_ID_', '_OBJECT_ID_');

  it('create comment job from text segment', () => {
    expect(
      createInteractJobs(commentTarget, [
        {
          type: 'text',
          node: 'hello',
          path: '?',
          value: 'hello',
        },
      ])
    ).toMatchInlineSnapshot(`
      Array [
        Object {
          "consumeResult": undefined,
          "registerResult": undefined,
          "request": Object {
            "body": Object {
              "message": "hello",
            },
            "method": "POST",
            "relative_url": "_OBJECT_ID_/comments",
          },
        },
      ]
    `);
  });

  it('create comment job from unit segment', () => {
    expect(
      createInteractJobs(commentTarget, [
        {
          type: 'unit',
          node: <Foo />,
          path: '?',
          value: {
            type: 'comment',
            params: {
              message: 'hello',
              attachment_share_url: 'http://sociably.js/hello.jpg',
            },
          },
        },
      ])
    ).toMatchInlineSnapshot(`
      Array [
        Object {
          "consumeResult": undefined,
          "registerResult": undefined,
          "request": Object {
            "body": Object {
              "attachment_share_url": "http://sociably.js/hello.jpg",
              "message": "hello",
            },
            "method": "POST",
            "relative_url": "_OBJECT_ID_/comments",
          },
        },
      ]
    `);
  });

  it('create comment job with photo attachment', () => {
    const jobs = createInteractJobs(commentTarget, [
      {
        type: 'unit',
        node: <Foo />,
        path: '?',
        value: {
          type: 'comment',
          params: { message: 'hello' },
          photo: {
            type: 'page',
            apiPath: 'me/photos',
            params: {},
            attachFile: {
              data: Buffer.from('foo'),
            },
          },
        },
      },
    ]);
    expect(jobs).toMatchInlineSnapshot(`
      Array [
        Object {
          "assetTag": undefined,
          "fileData": Object {
            "data": Array [
              102,
              111,
              111,
            ],
            "type": "Buffer",
          },
          "fileInfo": undefined,
          "registerResult": "l9v0s5g4-3",
          "request": Object {
            "body": Object {},
            "method": "POST",
            "relative_url": "me/photos",
          },
        },
        Object {
          "consumeResult": Object {
            "accomplishRequest": [Function],
            "keys": Array [
              "l9v0s5g4-3",
            ],
          },
          "registerResult": undefined,
          "request": Object {
            "body": Object {
              "message": "hello",
            },
            "method": "POST",
            "relative_url": "_OBJECT_ID_/comments",
          },
        },
      ]
    `);
    const consumePhotoResult = jobs[1].consumeResult;
    expect(consumePhotoResult?.keys).toEqual([jobs[0].registerResult]);

    getRegisteredResult.mock.fakeReturnValue('_PHOTO_ID_');
    expect(
      consumePhotoResult?.accomplishRequest(
        jobs[1].request,
        ['resultKey'],
        getRegisteredResult
      )
    ).toMatchInlineSnapshot(`
      Object {
        "body": Object {
          "attachment_id": "_PHOTO_ID_",
          "message": "hello",
        },
        "method": "POST",
        "relative_url": "_OBJECT_ID_/comments",
      }
    `);
    expect(getRegisteredResult).toHaveBeenCalledTimes(1);
    expect(getRegisteredResult).toHaveBeenCalledWith('resultKey', '$.id');
  });

  it('create chaining comment jobs', () => {
    const jobs = createInteractJobs(commentTarget, [
      {
        type: 'unit',
        node: <Foo />,
        path: '?',
        value: {
          type: 'comment',
          params: { message: 'foo' },
        },
      },
      { type: 'text', node: <Foo />, path: '?', value: 'bar' },
      {
        type: 'unit',
        node: <Foo />,
        path: '?',
        value: {
          type: 'comment',
          params: { message: 'baz' },
          photo: {
            type: 'page',
            apiPath: 'me/photos',
            params: {
              url: 'http://sociably.js',
            },
          },
        },
      },
    ]);
    expect(jobs).toMatchInlineSnapshot(`
      Array [
        Object {
          "consumeResult": undefined,
          "registerResult": "l9v0s5g4-4",
          "request": Object {
            "body": Object {
              "message": "foo",
            },
            "method": "POST",
            "relative_url": "_OBJECT_ID_/comments",
          },
        },
        Object {
          "consumeResult": Object {
            "accomplishRequest": [Function],
            "keys": Array [
              "l9v0s5g4-4",
            ],
          },
          "registerResult": "l9v0s5g4-5",
          "request": Object {
            "body": Object {
              "message": "bar",
            },
            "method": "POST",
            "relative_url": "_OBJECT_ID_/comments",
          },
        },
        Object {
          "assetTag": undefined,
          "fileData": undefined,
          "fileInfo": undefined,
          "registerResult": "l9v0s5g4-6",
          "request": Object {
            "body": Object {
              "url": "http://sociably.js",
            },
            "method": "POST",
            "relative_url": "me/photos",
          },
        },
        Object {
          "consumeResult": Object {
            "accomplishRequest": [Function],
            "keys": Array [
              "l9v0s5g4-6",
              "l9v0s5g4-5",
            ],
          },
          "registerResult": undefined,
          "request": Object {
            "body": Object {
              "message": "baz",
            },
            "method": "POST",
            "relative_url": "_OBJECT_ID_/comments",
          },
        },
      ]
    `);

    const consumeResult2 = jobs[1].consumeResult;
    expect(consumeResult2?.keys).toEqual([jobs[0].registerResult]);

    getRegisteredResult.mock.fakeReturnValue('_COMMENT_ID_1_');
    expect(
      consumeResult2?.accomplishRequest(
        jobs[1].request,
        ['commentResultKey'],
        getRegisteredResult
      )
    ).toMatchInlineSnapshot(`
      Object {
        "body": Object {
          "message": "bar",
        },
        "method": "POST",
        "relative_url": "_COMMENT_ID_1_/comments",
      }
    `);
    expect(getRegisteredResult).toHaveBeenCalledTimes(1);
    expect(getRegisteredResult).toHaveBeenCalledWith(
      'commentResultKey',
      '$.id'
    );

    const consumeResult3 = jobs[3].consumeResult;
    const comment2ResultKey = jobs[1].registerResult;
    const photoResultKey = jobs[2].registerResult;
    expect(consumeResult3?.keys).toContain(comment2ResultKey);
    expect(consumeResult3?.keys).toContain(photoResultKey);

    getRegisteredResult.mock.fake((key) =>
      key === comment2ResultKey ? '_COMMENT_ID_2_' : '_PHOTO_ID_'
    );
    expect(
      consumeResult3?.accomplishRequest(
        jobs[1].request,
        consumeResult3.keys,
        getRegisteredResult
      )
    ).toMatchInlineSnapshot(`
      Object {
        "body": Object {
          "attachment_id": "_PHOTO_ID_",
          "message": "bar",
        },
        "method": "POST",
        "relative_url": "_COMMENT_ID_2_/comments",
      }
    `);
    expect(getRegisteredResult).toHaveBeenCalledTimes(3);
    expect(getRegisteredResult).toHaveBeenCalledWith(comment2ResultKey, '$.id');
    expect(getRegisteredResult).toHaveBeenCalledWith(photoResultKey, '$.id');
  });

  it('throw if invalid comment segment received', () => {
    expect(() =>
      createInteractJobs(commentTarget, [
        {
          type: 'unit',
          node: <Foo />,
          path: '?',
          value: {
            type: 'message',
            apiPath: PATH_MESSAGES,
            params: { message: { text: 'foo' } },
          },
        },
      ])
    ).toThrowErrorMatchingInlineSnapshot(`"invalid comment content <Foo />"`);
    expect(() =>
      createInteractJobs(commentTarget, [
        {
          type: 'unit',
          node: <Foo />,
          path: '?',
          value: {
            type: 'page',
            apiPath: PATH_FEED,
            params: { message: 'foo' },
          },
        },
      ])
    ).toThrowErrorMatchingInlineSnapshot(`"invalid comment content <Foo />"`);
  });
});
