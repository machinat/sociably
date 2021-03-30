import moxy from '@moxyjs/moxy';
import Machinat from '@machinat/core';
import { CHANNEL_REQUEST_GETTER, BULK_REQUEST_GETTER } from '../constant';
import LineChat from '../channel';
import { createChatJobs, createMulticastJobs } from '../job';

const Foo = () => null;
const Bar = () => null;
const Baz = () => null;

const apiCallGettable = moxy({
  [CHANNEL_REQUEST_GETTER]: () => ({
    method: 'POST',
    path: 'some/channel/api',
    body: { do: 'something' },
  }),
  [BULK_REQUEST_GETTER]: () => ({
    method: 'POST',
    path: 'some/bulk/api',
    body: { bulk: 'do something' },
  }),
});

const unitSegment = (node, value) => ({
  type: 'unit' as const,
  node,
  value,
  path: '?',
});

const segments = [
  unitSegment(<Foo />, { id: 0 }),
  unitSegment(<Foo />, { id: 1 }),
  unitSegment(<Foo />, { id: 2 }),
  unitSegment(<Foo />, { id: 3 }),
  unitSegment(<Foo />, { id: 4 }),
  unitSegment(<Foo />, { id: 5 }),
  unitSegment(<Foo />, { id: 6 }),
  unitSegment(<Bar />, { id: 7, ...apiCallGettable }),
  unitSegment(<Foo />, { id: 8 }),
  unitSegment(<Baz />, { id: 9, ...apiCallGettable }),
];

beforeEach(() => {
  apiCallGettable.mock.clear();
});

describe('createChatJobs()', () => {
  it('create api dispatch jobs', () => {
    const channel = new LineChat('_CHANNEL_ID_', 'user', 'john');

    const jobs = createChatJobs()(channel, segments);

    expect(jobs).toMatchInlineSnapshot(`
      Array [
        Object {
          "body": Object {
            "messages": Array [
              Object {
                "id": 0,
              },
              Object {
                "id": 1,
              },
              Object {
                "id": 2,
              },
              Object {
                "id": 3,
              },
              Object {
                "id": 4,
              },
            ],
            "to": "john",
          },
          "executionKey": "line._CHANNEL_ID_.john",
          "method": "POST",
          "path": "v2/bot/message/push",
        },
        Object {
          "body": Object {
            "messages": Array [
              Object {
                "id": 5,
              },
              Object {
                "id": 6,
              },
            ],
            "to": "john",
          },
          "executionKey": "line._CHANNEL_ID_.john",
          "method": "POST",
          "path": "v2/bot/message/push",
        },
        Object {
          "body": Object {
            "do": "something",
          },
          "executionKey": "line._CHANNEL_ID_.john",
          "method": "POST",
          "path": "some/channel/api",
        },
        Object {
          "body": Object {
            "messages": Array [
              Object {
                "id": 8,
              },
            ],
            "to": "john",
          },
          "executionKey": "line._CHANNEL_ID_.john",
          "method": "POST",
          "path": "v2/bot/message/push",
        },
        Object {
          "body": Object {
            "do": "something",
          },
          "executionKey": "line._CHANNEL_ID_.john",
          "method": "POST",
          "path": "some/channel/api",
        },
      ]
    `);

    expect(apiCallGettable[CHANNEL_REQUEST_GETTER].mock).toHaveBeenCalledTimes(
      2
    );
    expect(apiCallGettable[CHANNEL_REQUEST_GETTER].mock).toHaveBeenCalledWith(
      channel
    );
  });

  test('send first job with reply API if replyToken given', () => {
    const channel = new LineChat('_CHANNEL_ID_', 'user', 'john');
    const jobs = createChatJobs('__REPLY_TOKEN__')(channel, segments);

    expect(jobs).toMatchInlineSnapshot(`
      Array [
        Object {
          "body": Object {
            "messages": Array [
              Object {
                "id": 0,
              },
              Object {
                "id": 1,
              },
              Object {
                "id": 2,
              },
              Object {
                "id": 3,
              },
              Object {
                "id": 4,
              },
            ],
            "replyToken": "__REPLY_TOKEN__",
          },
          "executionKey": "line._CHANNEL_ID_.john",
          "method": "POST",
          "path": "v2/bot/message/reply",
        },
        Object {
          "body": Object {
            "messages": Array [
              Object {
                "id": 5,
              },
              Object {
                "id": 6,
              },
            ],
            "to": "john",
          },
          "executionKey": "line._CHANNEL_ID_.john",
          "method": "POST",
          "path": "v2/bot/message/push",
        },
        Object {
          "body": Object {
            "do": "something",
          },
          "executionKey": "line._CHANNEL_ID_.john",
          "method": "POST",
          "path": "some/channel/api",
        },
        Object {
          "body": Object {
            "messages": Array [
              Object {
                "id": 8,
              },
            ],
            "to": "john",
          },
          "executionKey": "line._CHANNEL_ID_.john",
          "method": "POST",
          "path": "v2/bot/message/push",
        },
        Object {
          "body": Object {
            "do": "something",
          },
          "executionKey": "line._CHANNEL_ID_.john",
          "method": "POST",
          "path": "some/channel/api",
        },
      ]
    `);

    expect(apiCallGettable[CHANNEL_REQUEST_GETTER].mock).toHaveBeenCalledTimes(
      2
    );
    expect(apiCallGettable[CHANNEL_REQUEST_GETTER].mock).toHaveBeenCalledWith(
      channel
    );
  });
});

describe('createMulticastJobs()', () => {
  it('create job of multicast api', () => {
    const jobs = createMulticastJobs(['foo', 'bar', 'baz'])(null, segments);

    expect(jobs).toMatchInlineSnapshot(`
      Array [
        Object {
          "body": Object {
            "messages": Array [
              Object {
                "id": 0,
              },
              Object {
                "id": 1,
              },
              Object {
                "id": 2,
              },
              Object {
                "id": 3,
              },
              Object {
                "id": 4,
              },
            ],
            "to": Array [
              "foo",
              "bar",
              "baz",
            ],
          },
          "executionKey": "$$_multicast_$$",
          "method": "POST",
          "path": "v2/bot/message/multicast",
        },
        Object {
          "body": Object {
            "messages": Array [
              Object {
                "id": 5,
              },
              Object {
                "id": 6,
              },
            ],
            "to": Array [
              "foo",
              "bar",
              "baz",
            ],
          },
          "executionKey": "$$_multicast_$$",
          "method": "POST",
          "path": "v2/bot/message/multicast",
        },
        Object {
          "body": Object {
            "bulk": "do something",
          },
          "executionKey": "$$_multicast_$$",
          "method": "POST",
          "path": "some/bulk/api",
        },
        Object {
          "body": Object {
            "messages": Array [
              Object {
                "id": 8,
              },
            ],
            "to": Array [
              "foo",
              "bar",
              "baz",
            ],
          },
          "executionKey": "$$_multicast_$$",
          "method": "POST",
          "path": "v2/bot/message/multicast",
        },
        Object {
          "body": Object {
            "bulk": "do something",
          },
          "executionKey": "$$_multicast_$$",
          "method": "POST",
          "path": "some/bulk/api",
        },
      ]
    `);

    expect(apiCallGettable[BULK_REQUEST_GETTER].mock).toHaveBeenCalledTimes(2);
    expect(apiCallGettable[BULK_REQUEST_GETTER].mock).toHaveBeenCalledWith([
      'foo',
      'bar',
      'baz',
    ]);
  });
});
