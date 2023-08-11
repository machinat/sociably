import { Readable } from 'stream';
import { IncomingMessage, ServerResponse } from 'http';
import { moxy, Mock, Moxy } from '@moxyjs/moxy';

import { TelegramReceiver } from '../Receiver.js';
import TelegramChat from '../Chat.js';
import TelegramUser from '../User.js';
import type { TelegramBot } from '../Bot.js';

const botId = 1111111;

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
  } as never);

const updateBody = {
  update_id: 9999,
  message: {
    message_id: 123,
    chat: {
      id: 67890,
      type: 'private',
      username: 'jojodoe',
      first_name: 'jojo',
      last_name: 'doe',
    },
    from: {
      id: 67890,
      is_bot: false,
      username: 'jojodoe',
      first_name: 'jojo',
      last_name: 'doe',
      language_code: 'en-US',
    },
    text: 'hello world',
  },
};

const agentSettingsAccessor = moxy({
  getAgentSettings: async () => ({
    botToken: '_BOT_TOKEN_',
    botName: 'MyBot',
    secretToken: '_SECRET_TOKEN_',
  }),
  getAgentSettingsBatch: async () => [],
});

const validRoutingInfo = {
  originalPath: '/telegram/1111111',
  basePath: '/',
  matchedPath: 'telegram',
  trailingPath: '1111111',
};

beforeEach(() => {
  bot.mock.reset();
  popEventMock.reset();
  popEventWrapper.mock.reset();
  agentSettingsAccessor.mock.reset();
});

it.each(['GET', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'UPDATE', 'UPGRADE'])(
  'respond 405 if req.method is %s',
  async (method) => {
    const receiver = new TelegramReceiver({
      bot,
      agentSettingsAccessor,
      shouldVerifySecretToken: false,
      popEventWrapper,
    });

    const req = createReq({ method });
    const res = createRes();

    await receiver.handleRequest(req as never, res, validRoutingInfo);

    expect(res.statusCode).toBe(405);
    expect(res.finished).toBe(true);
  }
);

it('respond 404 if bot ID entry path is invalid', async () => {
  const receiver = new TelegramReceiver({
    bot,
    webhookPath: '/telegram',
    agentSettingsAccessor,
    shouldVerifySecretToken: false,
    popEventWrapper,
  });

  let res = createRes();
  await receiver.handleRequest(
    createReq({
      method: 'POST',
      url: `/foo`,
      body: JSON.stringify(updateBody),
    }),
    res,
    {
      originalPath: '/telegram',
      basePath: '/',
      matchedPath: 'telegram',
      trailingPath: '',
    }
  );
  expect(res.statusCode).toBe(404);
  expect(res.finished).toBe(true);

  res = createRes();
  await receiver.handleRequest(
    createReq({
      method: 'POST',
      url: `/foo`,
      body: JSON.stringify(updateBody),
    }),
    res,
    {
      originalPath: '/telegram/foo',
      basePath: '/',
      matchedPath: 'telegram',
      trailingPath: 'foo',
    }
  );
  expect(res.statusCode).toBe(404);
  expect(res.finished).toBe(true);
});

it('respond 404 if bot settings not found', async () => {
  const receiver = new TelegramReceiver({
    bot,
    agentSettingsAccessor,
    shouldVerifySecretToken: false,
    popEventWrapper,
  });

  agentSettingsAccessor.getAgentSettings.mock.fake(async () => null);

  const req = createReq({
    method: 'POST',
    url: `/${botId}`,
    body: JSON.stringify(updateBody),
  });
  const res = createRes();

  await receiver.handleRequest(req, res, validRoutingInfo);

  expect(res.statusCode).toBe(404);
  expect(res.finished).toBe(true);
});

it('respond 400 if body is empty', async () => {
  const receiver = new TelegramReceiver({
    bot,
    agentSettingsAccessor,
    shouldVerifySecretToken: false,
    popEventWrapper,
  });

  const req = createReq({ method: 'POST', url: `/${botId}` });
  const res = createRes();

  await receiver.handleRequest(req, res, validRoutingInfo);

  expect(res.statusCode).toBe(400);
  expect(res.finished).toBe(true);
});

it('respond 400 if body is not in valid json format', async () => {
  const receiver = new TelegramReceiver({
    bot,
    agentSettingsAccessor,
    shouldVerifySecretToken: false,
    popEventWrapper,
  });

  const req = createReq({
    method: 'POST',
    url: `/${botId}`,
    body: "I'm Jason",
  });
  const res = createRes();

  await receiver.handleRequest(req, res, validRoutingInfo);

  expect(res.statusCode).toBe(400);
  expect(res.finished).toBe(true);
});

it('respond 200 and pop events received', async () => {
  const receiver = new TelegramReceiver({
    bot,
    agentSettingsAccessor,
    shouldVerifySecretToken: false,
    popEventWrapper,
  });

  const bodyStr = JSON.stringify(updateBody);

  const req = createReq({ method: 'POST', url: `/${botId}`, body: bodyStr });
  const res = createRes();

  await receiver.handleRequest(req, res, validRoutingInfo);

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
      url: `/${botId}`,
      headers: {},
      body: bodyStr,
    },
  });

  expect(context.event.platform).toBe('telegram');
  expect(context.event.category).toBe('message');
  expect(context.event.type).toBe('text');
  expect(context.event.thread).toEqual(
    new TelegramChat(botId, 67890, updateBody.message.chat as never)
  );
  expect(context.event.user).toEqual(
    new TelegramUser(67890, undefined, updateBody.message.from)
  );
  expect(context.event.payload).toEqual(updateBody);
});

describe('constext.reply(message)', () => {
  const receiver = new TelegramReceiver({
    bot,
    agentSettingsAccessor,
    shouldVerifySecretToken: false,
    popEventWrapper,
  });

  it("render to event.thread when it's available", async () => {
    await receiver.handleRequest(
      createReq({
        method: 'POST',
        url: `/${botId}`,
        body: JSON.stringify(updateBody),
      }),
      createRes(),
      validRoutingInfo
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

  it('render using event.channel if no event.thread', async () => {
    await receiver.handleRequest(
      createReq({
        method: 'POST',
        url: `/${botId}`,
        body: JSON.stringify({
          update_id: 9999,
          callback_query: {
            id: '12345',
            from: { id: '67890' },
            chat_instance: '43210',
            data: 'foo',
          },
        }),
      }),
      createRes(),
      validRoutingInfo
    );
    expect(popEventMock).toHaveBeenCalledTimes(1);
    const [{ reply, event }] = popEventMock.calls[0].args;
    await reply('hello callback_query');

    expect(bot.render).toHaveBeenCalledTimes(1);
    expect(bot.render).toHaveBeenCalledWith(
      event.channel,
      'hello callback_query'
    );
  });
});

it('verify "x-telegram-bot-api-secret-token" header matching options.secretToken', async () => {
  const receiver = new TelegramReceiver({
    bot,
    agentSettingsAccessor,
    popEventWrapper,
  });

  const req1 = createReq({
    method: 'POST',
    headers: {}, // absent
    url: `/${botId}`,
    body: JSON.stringify(updateBody),
  });
  const res1 = createRes();
  await receiver.handleRequest(req1, res1, validRoutingInfo);

  expect(res1.statusCode).toBe(401);
  expect(res1.finished).toBe(true);

  const req2 = createReq({
    method: 'POST',
    headers: { 'x-telegram-bot-api-secret-token': '_WRONG_TOKEN_' },
    url: `/${botId}`,
    body: JSON.stringify(updateBody),
  });
  const res2 = createRes();
  await receiver.handleRequest(req2, res2, {
    originalPath: '/telegram/123',
    basePath: '/',
    matchedPath: 'telegram',
    trailingPath: '123',
  });

  expect(res2.statusCode).toBe(401);
  expect(res2.finished).toBe(true);

  expect(popEventMock).not.toHaveBeenCalled();

  const req3 = createReq({
    method: 'POST',
    headers: { 'x-telegram-bot-api-secret-token': '_SECRET_TOKEN_' },
    url: `/${botId}`,
    body: JSON.stringify(updateBody),
  });
  const res3 = createRes();
  await receiver.handleRequest(req3, res3, validRoutingInfo);

  expect(res3.statusCode).toBe(200);
  expect(res3.finished).toBe(true);

  expect(popEventMock).toHaveBeenCalledTimes(1);
});
