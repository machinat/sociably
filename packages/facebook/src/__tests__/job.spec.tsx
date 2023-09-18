import moxy from '@moxyjs/moxy';
import Sociably from '@sociably/core';
import { createPostJobs, createInteractJobs } from '../job.js';
import { PATH_FEED, PATH_PHOTOS } from '../constant.js';
import FacebookPage from '../Page.js';
import FacebookInteractTarget from '../InteractTarget.js';
import { PagePhotoValue, PagePostValue } from '../types.js';

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

const getRegisteredResult = moxy(() => '');

beforeEach(() => {
  getRegisteredResult.mock.reset();
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
      ]),
    ).toMatchInlineSnapshot(`
      [
        {
          "channel": FacebookPage {
            "$$typeofChannel": true,
            "id": "1234567890",
            "platform": "facebook",
          },
          "request": {
            "method": "POST",
            "params": {
              "message": "hello facebook",
            },
            "url": "me/feed",
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
      ]),
    ).toMatchInlineSnapshot(`
      [
        {
          "channel": FacebookPage {
            "$$typeofChannel": true,
            "id": "1234567890",
            "platform": "facebook",
          },
          "file": undefined,
          "request": {
            "method": "POST",
            "params": {
              "object_attachment": "1234567890",
            },
            "url": "me/feed",
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
            file: {
              data: Buffer.from('thumb'),
            },
          },
        },
      ]),
    ).toMatchInlineSnapshot(`
      [
        {
          "channel": FacebookPage {
            "$$typeofChannel": true,
            "id": "1234567890",
            "platform": "facebook",
          },
          "file": {
            "data": {
              "data": [
                116,
                104,
                117,
                109,
                98,
              ],
              "type": "Buffer",
            },
          },
          "request": {
            "method": "POST",
            "params": {
              "description": "The social media framework",
              "link": "http://sociably.js.org",
              "name": "Sociably",
            },
            "url": "me/feed",
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
            file: {
              data: Buffer.from('foo'),
            },
          },
        },
      ]),
    ).toMatchInlineSnapshot(`
      [
        {
          "channel": FacebookPage {
            "$$typeofChannel": true,
            "id": "1234567890",
            "platform": "facebook",
          },
          "file": {
            "data": {
              "data": [
                102,
                111,
                111,
              ],
              "type": "Buffer",
            },
          },
          "request": {
            "method": "POST",
            "params": {},
            "url": "me/photos",
          },
        },
      ]
    `);
  });

  it('craete photo on an album', () => {
    const album = new FacebookInteractTarget(
      '1234567890',
      '9876543210',
      'album',
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
      ]),
    ).toMatchInlineSnapshot(`
      [
        {
          "channel": FacebookPage {
            "$$typeofChannel": true,
            "id": "1234567890",
            "platform": "facebook",
          },
          "file": undefined,
          "request": {
            "method": "POST",
            "params": {
              "url": "http://foo.bar/baz.jpg",
            },
            "url": "9876543210/photos",
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
        file: {
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
      [
        {
          "channel": FacebookPage {
            "$$typeofChannel": true,
            "id": "1234567890",
            "platform": "facebook",
          },
          "file": undefined,
          "registerResult": "l9v0s5g4-0",
          "request": {
            "method": "POST",
            "params": {
              "published": false,
              "temporary": undefined,
              "url": "http://sociably.com/foo.jpg",
            },
            "url": "me/photos",
          },
        },
        {
          "channel": FacebookPage {
            "$$typeofChannel": true,
            "id": "1234567890",
            "platform": "facebook",
          },
          "file": {
            "data": {
              "data": [
                98,
                97,
                114,
              ],
              "type": "Buffer",
            },
          },
          "registerResult": "l9v0s5g4-1",
          "request": {
            "method": "POST",
            "params": {
              "published": false,
              "temporary": undefined,
            },
            "url": "me/photos",
          },
        },
        {
          "channel": FacebookPage {
            "$$typeofChannel": true,
            "id": "1234567890",
            "platform": "facebook",
          },
          "consumeResult": {
            "accomplishRequest": [Function],
            "keys": [
              "l9v0s5g4-0",
              "l9v0s5g4-1",
            ],
          },
          "file": undefined,
          "request": {
            "method": "POST",
            "params": {
              "message": "foo",
            },
            "url": "me/feed",
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
        getRegisteredResult,
      ),
    ).toMatchInlineSnapshot(`
      {
        "method": "POST",
        "params": {
          "attached_media": [
            {
              "media_fbid": "_PHOTO_ID_1_",
            },
            {
              "media_fbid": "_PHOTO_ID_2_",
            },
          ],
          "message": "foo",
        },
        "url": "me/feed",
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
      ]),
    ).toMatchInlineSnapshot(`
      [
        {
          "channel": FacebookPage {
            "$$typeofChannel": true,
            "id": "1234567890",
            "platform": "facebook",
          },
          "file": undefined,
          "registerResult": "l9v0s5g4-2",
          "request": {
            "method": "POST",
            "params": {
              "published": false,
              "temporary": true,
              "url": "http://sociably.com/foo.jpg",
            },
            "url": "me/photos",
          },
        },
        {
          "channel": FacebookPage {
            "$$typeofChannel": true,
            "id": "1234567890",
            "platform": "facebook",
          },
          "consumeResult": {
            "accomplishRequest": [Function],
            "keys": [
              "l9v0s5g4-2",
            ],
          },
          "file": undefined,
          "request": {
            "method": "POST",
            "params": {
              "message": "foo",
              "scheduled_publish_time": 1666666666,
            },
            "url": "me/feed",
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
      ]),
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
      ]),
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
      ]),
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
      ]),
    ).toMatchInlineSnapshot(`
      [
        {
          "channel": FacebookPage {
            "$$typeofChannel": true,
            "id": "_PAGE_ID_",
            "platform": "facebook",
          },
          "consumeResult": undefined,
          "registerResult": undefined,
          "request": {
            "method": "POST",
            "params": {
              "message": "hello",
            },
            "url": "_OBJECT_ID_/comments",
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
      ]),
    ).toMatchInlineSnapshot(`
      [
        {
          "channel": FacebookPage {
            "$$typeofChannel": true,
            "id": "_PAGE_ID_",
            "platform": "facebook",
          },
          "consumeResult": undefined,
          "registerResult": undefined,
          "request": {
            "method": "POST",
            "params": {
              "attachment_share_url": "http://sociably.js/hello.jpg",
              "message": "hello",
            },
            "url": "_OBJECT_ID_/comments",
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
            file: {
              data: Buffer.from('foo'),
            },
          },
        },
      },
    ]);
    expect(jobs).toMatchInlineSnapshot(`
      [
        {
          "channel": FacebookPage {
            "$$typeofChannel": true,
            "id": "_PAGE_ID_",
            "platform": "facebook",
          },
          "file": {
            "data": {
              "data": [
                102,
                111,
                111,
              ],
              "type": "Buffer",
            },
          },
          "registerResult": "l9v0s5g4-3",
          "request": {
            "method": "POST",
            "params": {},
            "url": "me/photos",
          },
        },
        {
          "channel": FacebookPage {
            "$$typeofChannel": true,
            "id": "_PAGE_ID_",
            "platform": "facebook",
          },
          "consumeResult": {
            "accomplishRequest": [Function],
            "keys": [
              "l9v0s5g4-3",
            ],
          },
          "registerResult": undefined,
          "request": {
            "method": "POST",
            "params": {
              "message": "hello",
            },
            "url": "_OBJECT_ID_/comments",
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
        getRegisteredResult,
      ),
    ).toMatchInlineSnapshot(`
      {
        "method": "POST",
        "params": {
          "attachment_id": "_PHOTO_ID_",
          "message": "hello",
        },
        "url": "_OBJECT_ID_/comments",
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
      [
        {
          "channel": FacebookPage {
            "$$typeofChannel": true,
            "id": "_PAGE_ID_",
            "platform": "facebook",
          },
          "consumeResult": undefined,
          "registerResult": "l9v0s5g4-4",
          "request": {
            "method": "POST",
            "params": {
              "message": "foo",
            },
            "url": "_OBJECT_ID_/comments",
          },
        },
        {
          "channel": FacebookPage {
            "$$typeofChannel": true,
            "id": "_PAGE_ID_",
            "platform": "facebook",
          },
          "consumeResult": {
            "accomplishRequest": [Function],
            "keys": [
              "l9v0s5g4-4",
            ],
          },
          "registerResult": "l9v0s5g4-5",
          "request": {
            "method": "POST",
            "params": {
              "message": "bar",
            },
            "url": "_OBJECT_ID_/comments",
          },
        },
        {
          "channel": FacebookPage {
            "$$typeofChannel": true,
            "id": "_PAGE_ID_",
            "platform": "facebook",
          },
          "file": undefined,
          "registerResult": "l9v0s5g4-6",
          "request": {
            "method": "POST",
            "params": {
              "url": "http://sociably.js",
            },
            "url": "me/photos",
          },
        },
        {
          "channel": FacebookPage {
            "$$typeofChannel": true,
            "id": "_PAGE_ID_",
            "platform": "facebook",
          },
          "consumeResult": {
            "accomplishRequest": [Function],
            "keys": [
              "l9v0s5g4-6",
              "l9v0s5g4-5",
            ],
          },
          "registerResult": undefined,
          "request": {
            "method": "POST",
            "params": {
              "message": "baz",
            },
            "url": "_OBJECT_ID_/comments",
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
        getRegisteredResult,
      ),
    ).toMatchInlineSnapshot(`
      {
        "method": "POST",
        "params": {
          "message": "bar",
        },
        "url": "_COMMENT_ID_1_/comments",
      }
    `);
    expect(getRegisteredResult).toHaveBeenCalledTimes(1);
    expect(getRegisteredResult).toHaveBeenCalledWith(
      'commentResultKey',
      '$.id',
    );

    const consumeResult3 = jobs[3].consumeResult;
    const comment2ResultKey = jobs[1].registerResult;
    const photoResultKey = jobs[2].registerResult;
    expect(consumeResult3?.keys).toContain(comment2ResultKey);
    expect(consumeResult3?.keys).toContain(photoResultKey);

    getRegisteredResult.mock.fake((key) =>
      key === comment2ResultKey ? '_COMMENT_ID_2_' : '_PHOTO_ID_',
    );
    expect(
      consumeResult3?.accomplishRequest(
        jobs[1].request,
        consumeResult3.keys,
        getRegisteredResult,
      ),
    ).toMatchInlineSnapshot(`
      {
        "method": "POST",
        "params": {
          "attachment_id": "_PHOTO_ID_",
          "message": "bar",
        },
        "url": "_COMMENT_ID_2_/comments",
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
            apiPath: 'me/messages',
            params: { message: { text: 'foo' } },
          },
        },
      ]),
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
      ]),
    ).toThrowErrorMatchingInlineSnapshot(`"invalid comment content <Foo />"`);
  });
});
