import moxy from 'moxy';
import Machinat from '@machinat/core';
import { CHANNEL_API_CALL_GETTER, BULK_API_CALL_GETTER } from '../constant';
import LineChannel from '../channel';
import { chatJobsMaker, multicastJobsMaker } from '../job';

const Foo = () => {};
const Bar = () => {};
const Baz = () => {};

const dynamicAPICaller = moxy({
  [CHANNEL_API_CALL_GETTER]: () => ({
    method: 'POST',
    path: 'some/channel/api',
    body: { do: 'something' },
  }),
  [BULK_API_CALL_GETTER]: () => ({
    method: 'POST',
    path: 'some/bulk/api',
    body: { bulk: 'do something' },
  }),
});

const segments = [
  { node: <Foo />, value: { id: 0 } },
  { node: <Foo />, value: { id: 1 } },
  { node: <Foo />, value: { id: 2 } },
  { node: <Foo />, value: { id: 3 } },
  { node: <Foo />, value: { id: 4 } },
  { node: <Foo />, value: { id: 5 } },
  { node: <Foo />, value: { id: 6 } },
  { node: <Bar />, value: { id: 7, ...dynamicAPICaller } },
  { node: <Foo />, value: { id: 8 } },
  { node: <Baz />, value: { id: 9, ...dynamicAPICaller } },
];

beforeEach(() => {
  dynamicAPICaller.mock.clear();
});

describe('chatJobsMaker()', () => {
  it('make push jobs', () => {
    const channel = new LineChannel('_LINE_CHANNEL_ID_', {
      type: 'user',
      userId: 'john',
    });

    const jobs = chatJobsMaker()(channel, segments);

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
          "channelUid": "line._LINE_CHANNEL_ID_.user.john",
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
          "channelUid": "line._LINE_CHANNEL_ID_.user.john",
          "method": "POST",
          "path": "v2/bot/message/push",
        },
        Object {
          "body": Object {
            "do": "something",
          },
          "channelUid": "line._LINE_CHANNEL_ID_.user.john",
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
          "channelUid": "line._LINE_CHANNEL_ID_.user.john",
          "method": "POST",
          "path": "v2/bot/message/push",
        },
        Object {
          "body": Object {
            "do": "something",
          },
          "channelUid": "line._LINE_CHANNEL_ID_.user.john",
          "method": "POST",
          "path": "some/channel/api",
        },
      ]
    `);

    expect(
      dynamicAPICaller[CHANNEL_API_CALL_GETTER].mock
    ).toHaveBeenCalledTimes(2);
    expect(dynamicAPICaller[CHANNEL_API_CALL_GETTER].mock).toHaveBeenCalledWith(
      channel
    );
  });

  test('make reply job', () => {
    const channel = new LineChannel('_LINE_CHANNEL_ID_', {
      type: 'user',
      userId: 'john',
    });

    const jobs = chatJobsMaker('__REPLY_TOKEN__')(
      channel,
      segments.slice(0, 5)
    );

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
          "channelUid": "line._LINE_CHANNEL_ID_.user.john",
          "method": "POST",
          "path": "v2/bot/message/reply",
        },
      ]
    `);
  });

  it('throw if multiple messaging job made when reply', () => {
    const channel = new LineChannel('_LINE_CHANNEL_ID_', {
      type: 'user',
      userId: 'john',
    });

    expect(() =>
      chatJobsMaker('__REPLY_TOKEN__')(channel, segments)
    ).toThrowErrorMatchingInlineSnapshot(
      `"more then 1 messaging request rendered while using replyToken"`
    );
  });
});

describe('multicastJobsMaker()', () => {
  it('create job of multicast api', () => {
    const jobs = multicastJobsMaker(['foo', 'bar', 'baz'])(null, segments);

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
          "method": "POST",
          "path": "v2/bot/message/multicast",
        },
        Object {
          "body": Object {
            "bulk": "do something",
          },
          "channelUid": undefined,
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
          "method": "POST",
          "path": "v2/bot/message/multicast",
        },
        Object {
          "body": Object {
            "bulk": "do something",
          },
          "channelUid": undefined,
          "method": "POST",
          "path": "some/bulk/api",
        },
      ]
    `);

    expect(jobs[0].channelUid).toBe(undefined);
    expect(jobs[0].channelUid).toBe(undefined);

    expect(dynamicAPICaller[BULK_API_CALL_GETTER].mock).toHaveBeenCalledTimes(
      2
    );
    expect(dynamicAPICaller[BULK_API_CALL_GETTER].mock).toHaveBeenCalledWith([
      'foo',
      'bar',
      'baz',
    ]);
  });
});
