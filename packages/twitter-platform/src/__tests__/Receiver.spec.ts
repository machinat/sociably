import { Readable } from 'stream';
import { IncomingMessage, ServerResponse } from 'http';
import moxy, { Mock, Moxy } from '@moxyjs/moxy';

import { TwitterReceiver } from '../Receiver.js';
import TwitterChat from '../Chat.js';
import TwitterUser from '../User.js';
import type { TwitterBot } from '../Bot.js';

const bot = moxy<TwitterBot>({
  render: async () => ({ tasks: [], results: [], jobs: [] }),
} as never);

const popEventMock = new Mock();
const popEventWrapper = moxy((popEvent) => popEventMock.proxify(popEvent));

const createReq = ({
  method,
  url = '/',
  body = '',
  headers = {},
}): IncomingMessage => {
  const req = new Readable({
    read() {
      if (body) req.push(body);
      req.push(null);
    },
  });
  return Object.assign(req, { method, url, body, headers }) as never;
};

const createRes = (): Moxy<ServerResponse> =>
  moxy({
    writableEnded: false,
    statusCode: 200,
    writeHead(code) {
      this.statusCode = code;
      return this;
    },
    end(...args) {
      this.writableEnded = true;
      for (let i = args.length - 1; i >= 0; i -= 1) {
        if (typeof args[i] === 'function') args[i]();
      }
    },
  } as any);

const messageEventBody = {
  for_user_id: '4337869213',
  direct_message_events: [
    {
      type: 'message_create',
      id: '954491830116155396',
      created_timestamp: '1516403560557',
      message_create: {
        target: { recipient_id: '4337869213' },
        sender_id: '3001969357',
        source_app_id: '13090192',
        message_data: { text: 'Hello World!', entities: {} },
      },
    },
  ],
  apps: {
    '13090192': {
      id: '13090192',
      name: 'MyApp',
      url: 'https://twitter.com/myapp',
    },
  },
  users: {
    '3001969357': {
      id: '3001969357',
      name: 'Jordan Brinks',
      screen_name: 'furiouscamper',
    },
    '4337869213': {
      id: '4337869213',
      name: 'Harrison Test',
      screen_name: 'Harris_0ff',
    },
  },
};

const appSecret = '__APP_SECRET__';

beforeEach(() => {
  bot.mock.reset();
  popEventMock.reset();
  popEventWrapper.mock.reset();
});

it('throw if options.appSecret is empty', () => {
  expect(
    () => new TwitterReceiver({ bot, popEventWrapper } as never),
  ).toThrowErrorMatchingInlineSnapshot(
    `"options.appSecret should not be empty"`,
  );
});

it.each(['PUT', 'PATCH', 'DELETE', 'HEAD', 'UPDATE', 'UPGRADE'])(
  'responds 405 if req.method is %s',
  async (method) => {
    const receiver = new TwitterReceiver({
      bot,
      popEventWrapper,
      appSecret,
    });

    const req = createReq({ method });
    const res = createRes();

    await receiver.handleRequest(req as never, res);

    expect(res.statusCode).toBe(405);
    expect(res.writableEnded).toBe(true);
  },
);

it('responds 400 if body is empty', async () => {
  const receiver = new TwitterReceiver({ bot, popEventWrapper, appSecret });

  const req = createReq({ method: 'POST' });
  const res = createRes();

  await receiver.handleRequest(req, res);

  expect(res.statusCode).toBe(400);
  expect(res.writableEnded).toBe(true);
});

it('responds 400 if body is not valid json', async () => {
  const receiver = new TwitterReceiver({
    bot,
    popEventWrapper,
    appSecret,
    shouldVerifyRequest: false,
  });

  const req = createReq({ method: 'POST', body: "I'm Jason" });
  const res = createRes();

  await receiver.handleRequest(req, res);

  expect(res.statusCode).toBe(400);
  expect(res.writableEnded).toBe(true);
});

it('respond 200 and pop events', async () => {
  const receiver = new TwitterReceiver({
    bot,
    popEventWrapper,
    appSecret,
    shouldVerifyRequest: false,
  });
  const bodyStr = JSON.stringify(messageEventBody);
  const req = createReq({ method: 'POST', body: bodyStr });
  const res = createRes();

  await receiver.handleRequest(req, res);

  expect(res.statusCode).toBe(200);
  expect(res.writableEnded).toBe(true);

  expect(popEventMock).toHaveBeenCalledTimes(1);
  const context = popEventMock.calls[0].args[0];

  expect(context.platform).toBe('twitter');
  expect(context.bot).toBe(bot);
  expect(context.metadata).toEqual({
    source: 'webhook',
    request: { method: 'POST', url: '/', headers: {}, body: bodyStr },
  });

  expect(context.event.platform).toBe('twitter');
  expect(context.event.category).toBe('message');
  expect(context.event.type).toBe('text');
  expect(context.event.channel).toEqual(new TwitterUser('4337869213'));
  expect(context.event.thread).toEqual(
    new TwitterChat('4337869213', '3001969357'),
  );
  expect(context.event.user).toEqual(
    new TwitterUser(
      '3001969357',
      messageEventBody.users['3001969357'] as never,
    ),
  );
  expect(context.event.payload).toEqual(
    messageEventBody.direct_message_events[0],
  );
  expect(context.event.forUserId).toEqual(messageEventBody.for_user_id);
  expect(context.event.appsMapping).toEqual(messageEventBody.apps);
  expect(context.event.usersMapping).toEqual(messageEventBody.users);
});

describe('context.reply(message)', () => {
  const receiver = new TwitterReceiver({
    bot,
    popEventWrapper,
    appSecret,
    shouldVerifyRequest: false,
  });

  test('render message on event.thread', async () => {
    await receiver.handleRequest(
      createReq({ method: 'POST', body: JSON.stringify(messageEventBody) }),
      createRes(),
    );

    expect(popEventMock).toHaveBeenCalledTimes(1);
    const { reply, event } = popEventMock.calls[0].args[0];
    await expect(reply('hello world')).resolves.toMatchInlineSnapshot(`
      {
        "jobs": [],
        "results": [],
        "tasks": [],
      }
    `);

    expect(bot.render).toHaveBeenCalledTimes(1);
    expect(bot.render).toHaveBeenCalledWith(event.thread, 'hello world');
  });

  it('throw if context.thread is null', async () => {
    await receiver.handleRequest(
      createReq({
        method: 'POST',
        body: JSON.stringify({
          user_event: {
            revoke: {
              date_time: '2018-05-24T09:48:12+00:00',
              target: { app_id: '13090192' },
              source: { user_id: '63046977' },
            },
          },
        }),
      }),
      createRes(),
    );
    expect(popEventMock).toHaveBeenCalledTimes(1);
    const [{ reply }] = popEventMock.calls[0].args;

    await expect(
      reply('hello world'),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `"Cannot reply to subscription_revoke event with no chat thread info"`,
    );
    expect(bot.render).not.toHaveBeenCalled();
  });
});

it('verify request with appSecret', async () => {
  const receiver = new TwitterReceiver({ bot, popEventWrapper, appSecret });
  const payload =
    '{"for_user_id":"930524282358325248","tweet_delete_events":[{"status":{"id":"1045405559317569537","user_id":"930524282358325248"},"timestamp_ms":"1432228155593"}]}';

  const req1 = createReq({
    method: 'POST',
    body: payload,
    headers: {
      'x-twitter-webhooks-signature':
        'sha256=fN0FZVManGRnnMhAWWT/UI58TXGACAt7RY5H2/akMa4=',
    },
  });
  const res1 = createRes();
  await receiver.handleRequest(req1, res1);

  expect(res1.statusCode).toBe(200);
  expect(res1.writableEnded).toBe(true);
  expect(popEventMock).toHaveBeenCalledTimes(1);

  const req2 = createReq({
    method: 'POST',
    body: payload,
  });
  const res2 = createRes();
  await receiver.handleRequest(req2, res2);

  expect(res2.statusCode).toBe(401);
  expect(res2.writableEnded).toBe(true);

  const req3 = createReq({
    method: 'POST',
    body: payload,
    headers: { 'x-twitter-webhooks-signature': 'sha256=__WRONG_SIGNATURE__' },
  });
  const res3 = createRes();
  await receiver.handleRequest(req3, res3);

  expect(res3.statusCode).toBe(401);
  expect(res3.writableEnded).toBe(true);

  expect(popEventMock).toHaveBeenCalledTimes(1);
  expect(popEventMock.calls[0].args[0].event.type).toBe('delete_tweet');
});

it('handle webhook challenge', async () => {
  const receiver = new TwitterReceiver({ bot, popEventWrapper, appSecret });

  const res1 = createRes();
  await receiver.handleRequest(
    createReq({
      method: 'GET',
      url: '/?crc_token=__TOKEN_FROM_TWITTER__&nonce=__NONCE__',
      headers: {
        'x-twitter-webhooks-signature':
          'sha256=bsQqpx1cyheVTwyNGGPmTeY+SLC8YZIwOfr5Kcb2fQE=',
      },
    }),
    res1,
  );

  expect(res1.statusCode).toBe(200);
  expect(res1.writableEnded).toBe(true);
  expect(res1.end.mock.calls[0].args[0]).toBe(
    '{"response_token":"sha256=rPq0FJoFEukzQI8G52D6xjiQ4BGXK4EuZWYZCWMMlsQ="}',
  );

  const res2 = createRes();
  await receiver.handleRequest(createReq({ method: 'GET', url: '/' }), res2);
  expect(res2.statusCode).toBe(400);
  expect(res2.writableEnded).toBe(true);

  const res3 = createRes();
  await receiver.handleRequest(
    createReq({
      method: 'GET',
      url: '/?crc_token=__TOKEN_FROM_TWITTER__&nonce=__NONCE__',
      headers: { 'x-twitter-webhooks-signature': 'sha256=__WRONG_SIGNATURE__' },
    }),
    res3,
  );
  expect(res3.statusCode).toBe(401);
  expect(res3.writableEnded).toBe(true);

  expect(popEventMock).not.toHaveBeenCalled();
});
