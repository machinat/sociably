import moxy from '@moxyjs/moxy';
import Sociably from '@sociably/core';
import LineChannel from '../Channel';
import LineChat from '../Chat';
import { createChatJobs, createMulticastJobs } from '../job';

const segment = (type: 'text' | 'unit', node, value) => ({
  type,
  node,
  value,
  path: '?',
});

const chatActionValue = moxy({
  type: 'chat_action',
  getChatRequest: () => ({
    method: 'POST',
    url: 'some/channel/api',
    params: { do: 'something' },
  }),
  getBulkRequest: () => ({
    method: 'POST',
    url: 'some/bulk/api',
    params: { bulk: 'do something' },
  }),
});

const segments = [
  segment('unit', <p />, {
    type: 'message',
    params: { type: 'text', text: '0' },
  }),
  segment('text', '1', '1'),
  segment('unit', <p />, {
    type: 'message',
    params: { type: 'text', text: '2' },
  }),
  segment('text', '3', '3'),
  segment('unit', <p />, {
    type: 'message',
    params: { type: 'text', text: '4' },
  }),
  segment('text', '5', '5'),
  segment('unit', <p />, {
    type: 'message',
    params: { type: 'text', text: '6' },
  }),
  segment('unit', <foo />, chatActionValue),
  segment('unit', <p />, {
    type: 'message',
    params: { type: 'text', text: '8' },
  }),
  segment('unit', <bar />, chatActionValue),
];

beforeEach(() => {
  chatActionValue.mock.reset();
});

describe('createChatJobs()', () => {
  it('create api dispatch jobs', () => {
    const thread = new LineChat('_CHANNEL_ID_', 'user', 'john');

    const jobs = createChatJobs(undefined)(thread, segments);

    expect(jobs).toMatchInlineSnapshot(`
      Array [
        Object {
          "accessToken": undefined,
          "chatChannelId": "_CHANNEL_ID_",
          "key": "line._CHANNEL_ID_.john",
          "method": "POST",
          "params": Object {
            "messages": Array [
              Object {
                "text": "0",
                "type": "text",
              },
              Object {
                "text": "1",
                "type": "text",
              },
              Object {
                "text": "2",
                "type": "text",
              },
              Object {
                "text": "3",
                "type": "text",
              },
              Object {
                "text": "4",
                "type": "text",
              },
            ],
            "to": "john",
          },
          "url": "v2/bot/message/push",
        },
        Object {
          "accessToken": undefined,
          "chatChannelId": "_CHANNEL_ID_",
          "key": "line._CHANNEL_ID_.john",
          "method": "POST",
          "params": Object {
            "messages": Array [
              Object {
                "text": "5",
                "type": "text",
              },
              Object {
                "text": "6",
                "type": "text",
              },
            ],
            "to": "john",
          },
          "url": "v2/bot/message/push",
        },
        Object {
          "accessToken": undefined,
          "chatChannelId": "_CHANNEL_ID_",
          "key": "line._CHANNEL_ID_.john",
          "method": "POST",
          "params": Object {
            "do": "something",
          },
          "url": "some/channel/api",
        },
        Object {
          "accessToken": undefined,
          "chatChannelId": "_CHANNEL_ID_",
          "key": "line._CHANNEL_ID_.john",
          "method": "POST",
          "params": Object {
            "messages": Array [
              Object {
                "text": "8",
                "type": "text",
              },
            ],
            "to": "john",
          },
          "url": "v2/bot/message/push",
        },
        Object {
          "accessToken": undefined,
          "chatChannelId": "_CHANNEL_ID_",
          "key": "line._CHANNEL_ID_.john",
          "method": "POST",
          "params": Object {
            "do": "something",
          },
          "url": "some/channel/api",
        },
      ]
    `);

    expect(chatActionValue.getChatRequest).toHaveBeenCalledTimes(2);
    expect(chatActionValue.getChatRequest).toHaveBeenCalledWith(thread);
  });

  test('send first job with reply API if replyToken given', () => {
    const thread = new LineChat('_CHANNEL_ID_', 'user', 'john');
    const jobs = createChatJobs('__REPLY_TOKEN__')(thread, segments);

    expect(jobs).toMatchInlineSnapshot(`
      Array [
        Object {
          "accessToken": undefined,
          "chatChannelId": "_CHANNEL_ID_",
          "key": "line._CHANNEL_ID_.john",
          "method": "POST",
          "params": Object {
            "messages": Array [
              Object {
                "text": "0",
                "type": "text",
              },
              Object {
                "text": "1",
                "type": "text",
              },
              Object {
                "text": "2",
                "type": "text",
              },
              Object {
                "text": "3",
                "type": "text",
              },
              Object {
                "text": "4",
                "type": "text",
              },
            ],
            "replyToken": "__REPLY_TOKEN__",
          },
          "url": "v2/bot/message/reply",
        },
        Object {
          "accessToken": undefined,
          "chatChannelId": "_CHANNEL_ID_",
          "key": "line._CHANNEL_ID_.john",
          "method": "POST",
          "params": Object {
            "messages": Array [
              Object {
                "text": "5",
                "type": "text",
              },
              Object {
                "text": "6",
                "type": "text",
              },
            ],
            "to": "john",
          },
          "url": "v2/bot/message/push",
        },
        Object {
          "accessToken": undefined,
          "chatChannelId": "_CHANNEL_ID_",
          "key": "line._CHANNEL_ID_.john",
          "method": "POST",
          "params": Object {
            "do": "something",
          },
          "url": "some/channel/api",
        },
        Object {
          "accessToken": undefined,
          "chatChannelId": "_CHANNEL_ID_",
          "key": "line._CHANNEL_ID_.john",
          "method": "POST",
          "params": Object {
            "messages": Array [
              Object {
                "text": "8",
                "type": "text",
              },
            ],
            "to": "john",
          },
          "url": "v2/bot/message/push",
        },
        Object {
          "accessToken": undefined,
          "chatChannelId": "_CHANNEL_ID_",
          "key": "line._CHANNEL_ID_.john",
          "method": "POST",
          "params": Object {
            "do": "something",
          },
          "url": "some/channel/api",
        },
      ]
    `);

    expect(chatActionValue.getChatRequest).toHaveBeenCalledTimes(2);
    expect(chatActionValue.getChatRequest).toHaveBeenCalledWith(thread);
  });

  it('throw if an invalid chat action received', () => {
    const thread = new LineChat('_CHANNEL_ID_', 'user', 'john');

    chatActionValue.mock.getter('getChatRequest').fakeReturnValue(null);

    expect(() =>
      createChatJobs(undefined)(thread, [
        segment('text', '0', '0'),
        segment('unit', <p />, {
          type: 'message',
          params: { type: 'text', text: '1' },
        }),
        segment('unit', <foo />, chatActionValue),
      ])
    ).toThrowErrorMatchingInlineSnapshot(
      `"<foo /> is not valid to be sent in a chat"`
    );
  });
});

describe('createMulticastJobs()', () => {
  const channel = new LineChannel('__CHANNEL_ID__');

  it('create job of multicast api', () => {
    const jobs = createMulticastJobs(channel, ['foo', 'bar', 'baz'])(
      null,
      segments
    );

    expect(jobs).toMatchInlineSnapshot(`
      Array [
        Object {
          "accessToken": undefined,
          "chatChannelId": "__CHANNEL_ID__",
          "key": "line.multicast",
          "method": "POST",
          "params": Object {
            "messages": Array [
              Object {
                "text": "0",
                "type": "text",
              },
              Object {
                "text": "1",
                "type": "text",
              },
              Object {
                "text": "2",
                "type": "text",
              },
              Object {
                "text": "3",
                "type": "text",
              },
              Object {
                "text": "4",
                "type": "text",
              },
            ],
            "to": Array [
              "foo",
              "bar",
              "baz",
            ],
          },
          "url": "v2/bot/message/multicast",
        },
        Object {
          "accessToken": undefined,
          "chatChannelId": "__CHANNEL_ID__",
          "key": "line.multicast",
          "method": "POST",
          "params": Object {
            "messages": Array [
              Object {
                "text": "5",
                "type": "text",
              },
              Object {
                "text": "6",
                "type": "text",
              },
            ],
            "to": Array [
              "foo",
              "bar",
              "baz",
            ],
          },
          "url": "v2/bot/message/multicast",
        },
        Object {
          "accessToken": undefined,
          "chatChannelId": "__CHANNEL_ID__",
          "key": "line.multicast",
          "method": "POST",
          "params": Object {
            "bulk": "do something",
          },
          "url": "some/bulk/api",
        },
        Object {
          "accessToken": undefined,
          "chatChannelId": "__CHANNEL_ID__",
          "key": "line.multicast",
          "method": "POST",
          "params": Object {
            "messages": Array [
              Object {
                "text": "8",
                "type": "text",
              },
            ],
            "to": Array [
              "foo",
              "bar",
              "baz",
            ],
          },
          "url": "v2/bot/message/multicast",
        },
        Object {
          "accessToken": undefined,
          "chatChannelId": "__CHANNEL_ID__",
          "key": "line.multicast",
          "method": "POST",
          "params": Object {
            "bulk": "do something",
          },
          "url": "some/bulk/api",
        },
      ]
    `);

    expect(chatActionValue.getBulkRequest).toHaveBeenCalledTimes(2);
    expect(chatActionValue.getBulkRequest).toHaveBeenCalledWith([
      'foo',
      'bar',
      'baz',
    ]);
  });

  it('throw if an invalid chat action received', () => {
    chatActionValue.mock.getter('getBulkRequest').fakeReturnValue(null);

    expect(() =>
      createMulticastJobs(channel, ['foo', 'bar', 'baz'])(null, [
        segment('text', '0', '0'),
        segment('unit', <p />, {
          type: 'message',
          params: { type: 'text', text: '1' },
        }),
        segment('unit', <foo />, chatActionValue),
      ])
    ).toThrowErrorMatchingInlineSnapshot(
      `"<foo /> is not valid to be sent by multicast"`
    );
  });
});
