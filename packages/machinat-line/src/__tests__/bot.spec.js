import nock from 'nock';
import moxy from 'moxy';
import Machinat from 'machinat';
import { Engine, Controller } from 'machinat-base';
import WebhookReceiver from 'machinat-webhook-receiver';
import LineBot from '../bot';
import Client from '../client';
import { LINE_NATIVE_TYPE } from '../symbol';

nock.disableNetConnect();

const Foo = moxy(props => [props]);
Foo.$$unit = true;
Foo.$$native = LINE_NATIVE_TYPE;

const Bar = moxy(props => [props]);
Bar.$$unit = true;
Bar.$$native = LINE_NATIVE_TYPE;
Bar.$$entry = moxy(() => 'bar');
Bar.$$hasBody = false;

const Baz = moxy(props => [props]);
Baz.$$unit = true;
Baz.$$native = LINE_NATIVE_TYPE;
Baz.$$entry = moxy(() => 'baz');
Baz.$$hasBody = true;

const msgs = [
  <Foo id={0} />,
  <Foo id={1} />,
  <Foo id={2} />,
  <Foo id={3} />,
  <Foo id={4} />,
  <Foo id={5} />,
  <Foo id={6} />,
  <Bar id={7} />,
  <Foo id={8} />,
  <Baz id={9} />,
];

const pathSpy = moxy(() => true);
const bodySpy = moxy(() => true);

const accessToken = '__ACCESS_TOKEN__';
let lineAPI;
beforeEach(() => {
  Bar.$$entry.mock.clear();
  Baz.$$entry.mock.clear();

  lineAPI = nock('https://api.line.me', {
    reqheaders: {
      'content-type': 'application/json',
      authorization: 'Bearer __ACCESS_TOKEN__',
    },
  });

  pathSpy.mock.clear();
  bodySpy.mock.clear();
});

it('throws if accessToken not given', () => {
  expect(() => new LineBot()).toThrowErrorMatchingInlineSnapshot(
    `"should provide accessToken to send messenge"`
  );
});

it('throws if shouldValidateRequest but channelSecret not given', () => {
  expect(
    () => new LineBot({ accessToken, shouldValidateRequest: true })
  ).toThrowErrorMatchingInlineSnapshot(
    `"should provide channelSecret if shouldValidateRequest set to true"`
  );
});

it('is ok to have channelSecret empty if shouldValidateRequest set to false', () => {
  expect(
    () => new LineBot({ accessToken, shouldValidateRequest: false })
  ).not.toThrow();
});

it('has engine, controller, receiver and client', () => {
  const bot = new LineBot({
    accessToken,
    channelSecret: '_SECRET_',
  });

  expect(bot.receiver).toBeInstanceOf(WebhookReceiver);
  expect(bot.controller).toBeInstanceOf(Controller);
  expect(bot.engine).toBeInstanceOf(Engine);
  expect(bot.client).toBeInstanceOf(Client);
});

it('have plugins initiated', () => {
  const plugins = [moxy(() => ({})), moxy(() => ({})), moxy(() => ({}))];

  const bot = new LineBot({
    accessToken,
    channelSecret: '_SECRET_',
    plugins,
  });

  expect(bot.plugins).toBe(plugins);
  expect(plugins[0].mock).toHaveBeenCalledWith(bot);
  expect(plugins[1].mock).toHaveBeenCalledWith(bot);
  expect(plugins[2].mock).toHaveBeenCalledWith(bot);
});

it('sets default options', () => {
  expect(new LineBot({ accessToken, channelSecret: '_SECRET_' }).options)
    .toMatchInlineSnapshot(`
Object {
  "accessToken": "__ACCESS_TOKEN__",
  "channelSecret": "_SECRET_",
  "connectionCapicity": 100,
  "shouldValidateRequest": true,
  "useReplyAPI": false,
}
`);
});

it('covers default options', () => {
  const options = {
    accessToken,
    shouldValidateRequest: false,
    channelSecret: '_SECRET_',
    connectionCapicity: 9999,
    useReplyAPI: true,
  };
  expect(new LineBot(options).options).toEqual(options);
});

test('#reply(token, node) works', async () => {
  const bot = new LineBot({
    accessToken,
    channelSecret: '_SECRET_',
    useReplyAPI: true,
  });

  const apiScope = lineAPI
    .post(pathSpy, bodySpy)
    .times(5)
    .reply(200, '{}');

  const results = await bot.reply('__REPLY_TOKEN__', msgs);

  expect(results).toMatchSnapshot();
  expect(apiScope.isDone()).toBe(true);

  expect(pathSpy.mock.calls.map(c => c.args[0])).toEqual([
    '/v2/bot/message/reply',
    '/v2/bot/message/reply',
    '/v2/bot/bar',
    '/v2/bot/message/reply',
    '/v2/bot/baz',
  ]);

  expect(bodySpy.mock.calls.map(c => c.args[0])).toMatchInlineSnapshot(`
Array [
  Object {
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
  Object {
    "messages": Array [
      Object {
        "id": 5,
      },
      Object {
        "id": 6,
      },
    ],
    "replyToken": "__REPLY_TOKEN__",
  },
  "",
  Object {
    "messages": Array [
      Object {
        "id": 8,
      },
    ],
    "replyToken": "__REPLY_TOKEN__",
  },
  Object {
    "id": 9,
  },
]
`);
});

test('#push(token, node) works', async () => {
  const bot = new LineBot({
    accessToken,
    channelSecret: '_SECRET_',
    useReplyAPI: false,
  });

  const apiScope = lineAPI
    .post(pathSpy, bodySpy)
    .times(5)
    .reply(200, '{}');

  const results = await bot.push('john doe', msgs);

  expect(results).toMatchSnapshot();
  expect(apiScope.isDone()).toBe(true);

  expect(pathSpy.mock.calls.map(c => c.args[0])).toEqual([
    '/v2/bot/message/push',
    '/v2/bot/message/push',
    '/v2/bot/bar',
    '/v2/bot/message/push',
    '/v2/bot/baz',
  ]);

  expect(bodySpy.mock.calls.map(c => c.args[0])).toMatchInlineSnapshot(`
Array [
  Object {
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
    "to": "john doe",
  },
  Object {
    "messages": Array [
      Object {
        "id": 5,
      },
      Object {
        "id": 6,
      },
    ],
    "to": "john doe",
  },
  "",
  Object {
    "messages": Array [
      Object {
        "id": 8,
      },
    ],
    "to": "john doe",
  },
  Object {
    "id": 9,
  },
]
`);
});

test('#multicast(targets, node) works', async () => {
  const bot = new LineBot({
    accessToken,
    channelSecret: '_SECRET_',
  });

  const apiScope = lineAPI
    .post(pathSpy, bodySpy)
    .times(2)
    .reply(200, '{}');

  const results = await bot.multicast(
    ['john', 'wick', 'dog'],
    msgs.slice(0, 7)
  );

  expect(results).toMatchSnapshot();
  expect(apiScope.isDone()).toBe(true);

  expect(pathSpy.mock.calls.map(c => c.args[0])).toEqual([
    '/v2/bot/message/multicast',
    '/v2/bot/message/multicast',
  ]);

  expect(bodySpy.mock.calls.map(c => c.args[0])).toMatchInlineSnapshot(`
Array [
  Object {
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
      "john",
      "wick",
      "dog",
    ],
  },
  Object {
    "messages": Array [
      Object {
        "id": 5,
      },
      Object {
        "id": 6,
      },
    ],
    "to": Array [
      "john",
      "wick",
      "dog",
    ],
  },
]
`);
});
