import { Readable } from 'stream';
import { IncomingMessage, ServerResponse } from 'http';
import moxy, { Mock, Moxy } from '@moxyjs/moxy';

import { TelegramReceiver } from '../receiver';
import { TelegramChat } from '../channel';
import TelegramUser from '../user';
import type { TelegramBot } from '../bot';

const bot = moxy<TelegramBot>({
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
    finished: false,
    statusCode: 200,
    writeHead(code) {
      this.statusCode = code;
      return this;
    },
    end(...args) {
      this.finished = true;
      for (let i = args.length - 1; i >= 0; i -= 1) {
        if (typeof args[i] === 'function') args[i]();
      }
    },
  } as any);

const updateBody = {
  update_id: 9999,
  message: {
    message_id: 123,
    chat: {
      id: 12345,
      type: 'private',
      username: 'jojodoe',
      first_name: 'jojo',
      last_name: 'doe',
    },
    from: {
      id: 12345,
      is_bot: false,
      username: 'jojodoe',
      first_name: 'jojo',
      last_name: 'doe',
      language_code: 'en-US',
    },
    text: 'hello world',
  },
};

beforeEach(() => {
  popEventMock.reset();
  popEventWrapper.mock.reset();
});

it('throw if options.botId is empty', () => {
  expect(
    () => new TelegramReceiver({ bot, popEventWrapper } as never)
  ).toThrowErrorMatchingInlineSnapshot(`"options.botId should not be empty"`);
});

it.each(['GET', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'UPDATE', 'UPGRADE'])(
  'responds 405 if req.method is %s',
  async (method) => {
    const receiver = new TelegramReceiver({
      bot,
      popEventWrapper,
      botId: 12345,
    });

    const req = createReq({ method });
    const res = createRes();

    await receiver.handleRequest(req as never, res);

    expect(res.statusCode).toBe(405);
    expect(res.finished).toBe(true);
  }
);

it('responds 400 if body is empty', async () => {
  const receiver = new TelegramReceiver({ bot, popEventWrapper, botId: 12345 });

  const req = createReq({ method: 'POST' });
  const res = createRes();

  await receiver.handleRequest(req, res);

  expect(res.statusCode).toBe(400);
  expect(res.finished).toBe(true);
});

it('responds 400 if body is not in valid json format', async () => {
  const receiver = new TelegramReceiver({ bot, popEventWrapper, botId: 12345 });

  const req = createReq({ method: 'POST', body: "I'm Jason" });
  const res = createRes();

  await receiver.handleRequest(req, res);

  expect(res.statusCode).toBe(400);
  expect(res.finished).toBe(true);
});

it('respond 200 and pop events received', async () => {
  const receiver = new TelegramReceiver({ bot, popEventWrapper, botId: 12345 });

  const bodyStr = JSON.stringify(updateBody);

  const req = createReq({ method: 'POST', body: bodyStr });
  const res = createRes();

  await receiver.handleRequest(req, res);

  expect(res.statusCode).toBe(200);
  expect(res.finished).toBe(true);

  expect(popEventMock).toHaveBeenCalledTimes(1);
  const context = popEventMock.calls[0].args[0];

  expect(context.platform).toBe('telegram');
  expect(context.bot).toBe(bot);
  expect(context.metadata).toEqual({
    source: 'webhook',
    request: {
      method: 'POST',
      url: '/',
      headers: {},
      body: bodyStr,
    },
  });

  expect(context.event.platform).toBe('telegram');
  expect(context.event.kind).toBe('message');
  expect(context.event.type).toBe('text');
  expect(context.event.channel).toEqual(
    new TelegramChat(12345, updateBody.message.chat as never)
  );
  expect(context.event.user).toEqual(
    new TelegramUser(12345, updateBody.message.from)
  );
  expect(context.event.payload).toEqual(updateBody);
});

test('reply(message) sugar', async () => {
  const receiver = new TelegramReceiver({ bot, popEventWrapper, botId: 12345 });

  await receiver.handleRequest(
    createReq({ method: 'POST', body: JSON.stringify(updateBody) }),
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
  expect(bot.render.mock).toHaveBeenCalledWith(event.channel, 'hello world');
});

it('verify request path matching options.secretPath', async () => {
  const receiver = new TelegramReceiver({
    bot,
    popEventWrapper,
    botId: 12345,
    secretPath: '__SECRET_PATH__',
  });

  const req1 = createReq({
    method: 'POST',
    url: '/__SECRET_PATH__',
    body: JSON.stringify(updateBody),
  });
  const res1 = createRes();
  await receiver.handleRequest(req1, res1);

  expect(res1.statusCode).toBe(200);
  expect(res1.finished).toBe(true);
  expect(popEventMock).toHaveBeenCalledTimes(1);

  const req2 = createReq({
    method: 'POST',
    url: '/__WRONG_PATH__',
    body: JSON.stringify(updateBody),
  });
  const res2 = createRes();
  await receiver.handleRequest(req2, res2);

  expect(res2.statusCode).toBe(401);
  expect(res2.finished).toBe(true);

  const req3 = createReq({
    method: 'POST',
    url: '/',
    body: JSON.stringify(updateBody),
  });
  const res3 = createRes();
  await receiver.handleRequest(req3, res3);

  expect(res3.statusCode).toBe(401);
  expect(res3.finished).toBe(true);

  expect(popEventMock).toHaveBeenCalledTimes(1);
});

test('verify secretPath with entryPath provided', async () => {
  const receiver = new TelegramReceiver({
    bot,
    popEventWrapper,
    botId: 12345,
    secretPath: '__SECRET_PATH__',
    entryPath: '/telegram',
  });

  const req1 = createReq({
    method: 'POST',
    url: '/telegram/__SECRET_PATH__',
    body: JSON.stringify(updateBody),
  });
  const res1 = createRes();
  await receiver.handleRequest(req1, res1);

  expect(res1.statusCode).toBe(200);
  expect(res1.finished).toBe(true);
  expect(popEventMock).toHaveBeenCalledTimes(1);

  const req2 = createReq({
    method: 'POST',
    url: '/telegram/__WRONG_PATH__',
    body: JSON.stringify(updateBody),
  });
  const res2 = createRes();
  await receiver.handleRequest(req2, res2);

  expect(res2.statusCode).toBe(401);
  expect(res2.finished).toBe(true);
  expect(popEventMock).toHaveBeenCalledTimes(1);

  const req3 = createReq({
    method: 'POST',
    url: '/telegram',
    body: JSON.stringify(updateBody),
  });
  const res3 = createRes();
  await receiver.handleRequest(req3, res3);

  expect(res3.statusCode).toBe(401);
  expect(res3.finished).toBe(true);
  expect(popEventMock).toHaveBeenCalledTimes(1);
});

it('verify secretPath if routing info is received', async () => {
  const receiver = new TelegramReceiver({
    bot,
    popEventWrapper,
    botId: 12345,
    secretPath: '__SECRET_PATH__',
  });

  const req1 = createReq({
    method: 'POST',
    url: '/webhook/telegram/__SECRET_PATH__',
    body: JSON.stringify(updateBody),
  });
  const res1 = createRes();
  await receiver.handleRequest(req1, res1, {
    originalPath: '/webhook/telegram/__SECRET_PATH__',
    matchedPath: '/webhook/telegram',
    trailingPath: '__SECRET_PATH__',
  });

  expect(res1.statusCode).toBe(200);
  expect(res1.finished).toBe(true);
  expect(popEventMock).toHaveBeenCalledTimes(1);

  const req2 = createReq({
    method: 'POST',
    url: '/webhook/telegram/__WRONG_PATH__',
    body: JSON.stringify(updateBody),
  });
  const res2 = createRes();
  await receiver.handleRequest(req2, res2, {
    originalPath: '/webhook/telegram/__WRONG_PATH__',
    matchedPath: '/webhook/telegram',
    trailingPath: '__WRONG_PATH__',
  });

  expect(res2.statusCode).toBe(401);
  expect(res2.finished).toBe(true);
  expect(popEventMock).toHaveBeenCalledTimes(1);
});
