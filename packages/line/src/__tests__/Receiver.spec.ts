import { IncomingMessage, ServerResponse } from 'http';
import { Readable } from 'stream';
import moxy, { Mock } from '@moxyjs/moxy';

import { LineReceiver } from '../Receiver';
import LineChat from '../Chat';
import LineUser from '../User';
import type { LineBot } from '../Bot';

const bot = moxy<LineBot>({
  render: async () => ({ jobs: [], tasks: [], results: [] }),
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
  return Object.assign(req, {
    method,
    url,
    body,
    headers,
  }) as never;
};

const createRes = (): ServerResponse =>
  moxy({
    finished: false,
    statusCode: 200,
    writeHead(code) {
      this.statusCode = code;
    },
    end(...args) {
      this.finished = true;
      for (let i = args.length - 1; i >= 0; i -= 1) {
        if (typeof args[i] === 'function') args[i]();
      }
    },
  } as never);

beforeEach(() => {
  popEventMock.reset();
  popEventWrapper.mock.reset();
});

it('throw if configs.providerId is empty', () => {
  expect(
    () =>
      new LineReceiver({
        bot,
        popEventWrapper,
        channelId: '_BOT_CHANNEL_ID_',
      } as never)
  ).toThrowErrorMatchingInlineSnapshot(
    `"configs.providerId should not be empty"`
  );
});

it('throw if configs.channelId is empty', () => {
  expect(
    () =>
      new LineReceiver({
        bot,
        popEventWrapper,
        providerId: '_PROVIDER_ID_',
      } as never)
  ).toThrowErrorMatchingInlineSnapshot(
    `"configs.channelId should not be empty"`
  );
});

it('throws if shouldValidateRequest but channelSecret not given', () => {
  expect(
    () =>
      new LineReceiver({
        bot,
        popEventWrapper,
        providerId: '_PROVIDER_ID_',
        channelId: '_BOT_CHANNEL_ID_',
        shouldValidateRequest: true,
      })
  ).toThrowErrorMatchingInlineSnapshot(
    `"should provide configs.channelSecret when shouldValidateRequest set to true"`
  );
});

it.each(['GET', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'UPDATE', 'UPGRADE'])(
  'responds 405 if req.method is %s',
  async (method) => {
    const receiver = new LineReceiver({
      bot,
      popEventWrapper,
      providerId: '_PROVIDER_ID_',
      channelId: '_BOT_CHANNEL_ID_',
      shouldValidateRequest: false,
    });

    const req = createReq({ method });
    const res = createRes();

    await receiver.handleRequest(req, res);

    expect(res.statusCode).toBe(405);
    expect(res.finished).toBe(true);
  }
);

it('responds 400 if body is empty', async () => {
  const receiver = new LineReceiver({
    bot,
    popEventWrapper,
    providerId: '_PROVIDER_ID_',
    channelId: '_BOT_CHANNEL_ID_',
    shouldValidateRequest: false,
  });

  const req = createReq({ method: 'POST' });
  const res = createRes();

  await receiver.handleRequest(req, res);

  expect(res.statusCode).toBe(400);
  expect(res.finished).toBe(true);
});

it('responds 400 if body is not not valid json format', async () => {
  const receiver = new LineReceiver({
    bot,
    popEventWrapper,
    providerId: '_PROVIDER_ID_',
    channelId: '_BOT_CHANNEL_ID_',
    shouldValidateRequest: false,
  });

  const req = createReq({ method: 'POST', body: "I'm Jason" });
  const res = createRes();

  await receiver.handleRequest(req, res);

  expect(res.statusCode).toBe(400);
  expect(res.finished).toBe(true);
});

it('responds 400 if body is in invalid format', async () => {
  const receiver = new LineReceiver({
    bot,
    popEventWrapper,
    providerId: '_PROVIDER_ID_',
    channelId: '_BOT_CHANNEL_ID_',
    shouldValidateRequest: false,
  });

  const req = createReq({
    method: 'POST',
    body: '{"there":"is no events hahaha"}',
  });
  const res = createRes();

  await receiver.handleRequest(req, res);

  expect(res.statusCode).toBe(400);
  expect(res.finished).toBe(true);
});

it('respond 200 and pop events received', async () => {
  const receiver = new LineReceiver({
    bot,
    popEventWrapper,
    providerId: '_PROVIDER_ID_',
    channelId: '_BOT_CHANNEL_ID_',
    shouldValidateRequest: false,
  });

  const body = {
    destination: 'xxxxxxxxxx',
    events: [
      {
        replyToken: '0f3779fba3b349968c5d07db31eab56f',
        type: 'message',
        timestamp: 1462629479859,
        source: {
          type: 'user',
          userId: 'U4af4980629',
        },
        message: {
          id: '325708',
          type: 'text',
          text: 'Hello, world',
        },
      },
      {
        replyToken: '8cf9239d56244f4197887e939187e19e',
        type: 'follow',
        timestamp: 1462629479859,
        source: {
          type: 'user',
          userId: 'U4af4980629',
        },
      },
    ],
  };

  const bodyStr = JSON.stringify(body);

  const req = createReq({
    method: 'POST',
    body: bodyStr,
  });
  const res = createRes();

  await receiver.handleRequest(req, res);

  expect(res.statusCode).toBe(200);
  expect(res.finished).toBe(true);

  expect(popEventMock).toHaveBeenCalledTimes(2);

  for (const {
    args: [ctx],
  } of popEventMock.calls) {
    expect(ctx.platform).toBe('line');
    expect(ctx.bot).toBe(bot);

    const { metadata, event } = ctx;

    expect(event.platform).toBe('line');
    expect(event.channel).toEqual(
      new LineChat('_BOT_CHANNEL_ID_', 'user', 'U4af4980629')
    );
    expect(event.user).toEqual(new LineUser('_PROVIDER_ID_', 'U4af4980629'));

    expect(metadata).toEqual({
      source: 'webhook',
      request: {
        method: 'POST',
        url: '/',
        headers: {},
        body: bodyStr,
      },
    });
  }

  const event1 = popEventMock.calls[0].args[0].event;
  expect(event1.category).toBe('message');
  expect(event1.type).toBe('text');
  expect(event1.payload).toEqual(body.events[0]);

  const event2 = popEventMock.calls[1].args[0].event;
  expect(event2.type).toBe('follow');
  expect(event2.category).toBe('action');
  expect(event2.payload).toEqual(body.events[1]);
});

test('reply(message) sugar', async () => {
  const receiver = new LineReceiver({
    bot,
    popEventWrapper,
    providerId: '_PROVIDER_ID_',
    channelId: '_BOT_CHANNEL_ID_',
    shouldValidateRequest: false,
  });

  await receiver.handleRequest(
    createReq({
      method: 'POST',
      body: '{"destination":"xxx","events":[{"replyToken":"__REPLY_TOKEN__","type":"message","timestamp":1462629479859,"source":{"type":"user","userId":"xxx"},"message":{"id":"325708","type":"text","text":"Hello, world"}}]}',
    }),
    createRes()
  );

  expect(popEventMock).toHaveBeenCalledTimes(1);
  const { reply, event } = popEventMock.calls[0].args[0];
  await expect(reply('hello world')).resolves.toMatchInlineSnapshot(`
          Object {
            "jobs": Array [],
            "results": Array [],
            "tasks": Array [],
          }
        `);

  expect(bot.render.mock).toHaveBeenCalledTimes(1);
  expect(bot.render.mock).toHaveBeenCalledWith(event.channel, 'hello world', {
    replyToken: event.replyToken,
  });
});

it('validate request', async () => {
  const receiver = new LineReceiver({
    bot,
    popEventWrapper,
    providerId: '_PROVIDER_ID_',
    channelId: '_BOT_CHANNEL_ID_',
    shouldValidateRequest: true,
    channelSecret: '__LINE_CHANNEL_SECRET__',
  });

  const body =
    '{"destination":"xxx","events":[{"replyToken":"xxx","type":"message","timestamp":1462629479859,"source":{"type":"user","userId":"xxx"},"message":{"id":"325708","type":"text","text":"Hello, world"}}]}';
  const hmac = 'tJIFpuDMyZ4a9XzwkNUBK2B/7NH5gxYJDR/57RCf+6k=';

  const req = createReq({
    method: 'POST',
    headers: { 'x-line-signature': hmac },
    body,
  });
  const res = createRes();

  await receiver.handleRequest(req, res);

  expect(res.statusCode).toBe(200);
  expect(res.finished).toBe(true);

  expect(popEventMock).toHaveBeenCalledTimes(1);
  const { event } = popEventMock.calls[0].args[0];

  expect(event.channel).toEqual(
    new LineChat('_BOT_CHANNEL_ID_', 'user', 'xxx')
  );
  expect(event.user).toEqual(new LineUser('_PROVIDER_ID_', 'xxx'));

  expect(event.category).toBe('message');
  expect(event.type).toBe('text');
  expect(event.payload).toEqual({
    replyToken: 'xxx',
    type: 'message',
    timestamp: 1462629479859,
    source: { type: 'user', userId: 'xxx' },
    message: { id: '325708', type: 'text', text: 'Hello, world' },
  });
});

it('responds 401 if request validation failed', async () => {
  const receiver = new LineReceiver({
    bot,
    popEventWrapper,
    providerId: '_PROVIDER_ID_',
    channelId: '_BOT_CHANNEL_ID_',
    shouldValidateRequest: true,
    channelSecret: '__LINE_CHANNEL_SECRET__',
  });

  const body =
    '{"destination":"xxx","events":[{"replyToken":"xxx","type":"message","timestamp":1462629479859,"source":{"type":"user","userId":"xxx"},"message":{"id":"325708","type":"text","text":"Hello, world"}}]}';
  const hmac = '__INVALID_SIGANATURE__';

  const req = createReq({
    method: 'POST',
    headers: { 'x-line-signature': hmac },
    body,
  });
  const res = createRes();

  await receiver.handleRequest(req, res);

  expect(res.statusCode).toBe(401);
  expect(res.finished).toBe(true);

  expect(popEventMock).not.toHaveBeenCalled();
});
