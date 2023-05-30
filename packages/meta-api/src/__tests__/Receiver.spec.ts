import type { IncomingMessage, ServerResponse } from 'http';
import { Readable } from 'stream';
import { moxy, Mock } from '@moxyjs/moxy';
import MetaWebhookReceiver from '../Receiver.js';

const bot = moxy({
  render: () => ({ jobs: [], results: [], tasks: [] }),
});

const defaultEvent = {
  platform: 'test',
  category: 'foo',
  type: 'baz',
  thread: { platform: 'test', uid: 'foo:123' },
  user: { platform: 'test', uid: 'foo:123' },
  payload: { id: '1234567890' },
};

const makeEventsFromUpdate = moxy(() => [defaultEvent]);

const popEventMock = new Mock();
const popEventWrapper = moxy((finalHandler) =>
  popEventMock.proxify((ctx) => finalHandler(ctx))
);

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

const createRes = () =>
  moxy<ServerResponse>({
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
  bot.mock.reset();
  popEventMock.clear();
  popEventWrapper.mock.clear();
  makeEventsFromUpdate.mock.reset();
});

it('throw if appSecret not given', () => {
  expect(
    () =>
      new MetaWebhookReceiver({
        shouldHandleChallenge: false,
        platform: 'test',
        bot,
        objectType: 'foo',
        makeEventsFromUpdate,
        popEventWrapper,
      })
  ).toThrowErrorMatchingInlineSnapshot(
    `"appSecret should not be empty if shouldVerifyRequest set to true"`
  );
});

it('throw if verifyToken not given', () => {
  expect(
    () =>
      new MetaWebhookReceiver({
        shouldVerifyRequest: false,
        platform: 'test',
        bot,
        objectType: 'foo',
        makeEventsFromUpdate,
        popEventWrapper,
      })
  ).toThrowErrorMatchingInlineSnapshot(
    `"verifyToken should not be empty if shouldHandleChallenge set to true"`
  );
});

describe('handling GET', () => {
  it('respond 403 if shouldHandleChallenge set to false', async () => {
    const receiver = new MetaWebhookReceiver({
      bot,
      platform: 'test',
      objectType: 'foo',
      makeEventsFromUpdate,
      popEventWrapper,
      shouldHandleChallenge: false,
      appSecret: '_APP_SECRET_',
    });

    const req = createReq({ method: 'GET' });
    const res = createRes();

    await receiver.handleRequest(req, res);

    expect(res.statusCode).toBe(403);
    expect(res.finished).toBe(true);

    expect(popEventMock).not.toHaveBeenCalled();
  });

  it.each(['', 'xxx', 'non_subscribe'])(
    'respond 400 if hub.mode param is not "subscribe"',
    async (mode) => {
      const receiver = new MetaWebhookReceiver({
        bot,
        platform: 'test',
        objectType: 'foo',
        makeEventsFromUpdate,
        popEventWrapper,
        verifyToken: '_MY_TOKEN_',
        shouldVerifyRequest: false,
      });

      const req = createReq({
        method: 'GET',
        url: `/?hub.mode=${encodeURIComponent(mode)}`,
      });
      const res = createRes();

      await receiver.handleRequest(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.finished).toBe(true);

      expect(popEventMock).not.toHaveBeenCalled();
    }
  );

  it('respond 400 if hub.verify_token param not matched', async () => {
    const receiver = new MetaWebhookReceiver({
      bot,
      platform: 'test',
      objectType: 'foo',
      makeEventsFromUpdate,
      popEventWrapper,
      verifyToken: '_MY_TOKEN_',
      shouldVerifyRequest: false,
    });

    const req = createReq({
      method: 'GET',
      url: '/?hub.mode=subscribe&hub.verify_token=_WRONG_TOKEN_',
    });
    const res = createRes();

    await receiver.handleRequest(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.finished).toBe(true);

    expect(popEventMock).not.toHaveBeenCalled();
  });

  it('respond 200 and hub.challenge within body', async () => {
    const receiver = new MetaWebhookReceiver({
      bot,
      platform: 'test',
      objectType: 'foo',
      makeEventsFromUpdate,
      popEventWrapper,
      verifyToken: '_MY_TOKEN_',
      shouldVerifyRequest: false,
    });

    const req = createReq({
      method: 'GET',
      url: '/?hub.mode=subscribe&hub.verify_token=_MY_TOKEN_&hub.challenge=FooBarBazHub',
    });
    const res = createRes();

    await receiver.handleRequest(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.finished).toBe(true);
    expect(res.end.mock.calls[0].args[0]).toBe('FooBarBazHub');

    expect(popEventMock).not.toHaveBeenCalled();
  });
});

describe('handling POST', () => {
  it('respond 400 if body is empty', async () => {
    const receiver = new MetaWebhookReceiver({
      bot,
      platform: 'test',
      objectType: 'foo',
      makeEventsFromUpdate,
      popEventWrapper,
      shouldHandleChallenge: false,
      shouldVerifyRequest: false,
    });

    const req = createReq({ method: 'POST' });
    const res = createRes();

    await receiver.handleRequest(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.finished).toBe(true);

    expect(popEventMock).not.toHaveBeenCalled();
  });

  it('respond 400 if body is not in valid JSON format', async () => {
    const receiver = new MetaWebhookReceiver({
      bot,
      platform: 'test',
      objectType: 'foo',
      makeEventsFromUpdate,
      popEventWrapper,
      shouldHandleChallenge: false,
      shouldVerifyRequest: false,
    });

    const req = createReq({ method: 'POST', body: 'I am Jason' });
    const res = createRes();

    await receiver.handleRequest(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.finished).toBe(true);

    expect(popEventMock).not.toHaveBeenCalled();
  });

  it('respond 404 if "object" field does not match "objectType"', async () => {
    const receiver = new MetaWebhookReceiver({
      bot,
      platform: 'test',
      objectType: 'foo',
      makeEventsFromUpdate,
      popEventWrapper,
      shouldHandleChallenge: false,
      shouldVerifyRequest: false,
    });

    const req = createReq({
      method: 'POST',
      body: '{"object":"bar","entry":[]}',
    });
    const res = createRes();

    await receiver.handleRequest(req, res);

    expect(res.statusCode).toBe(404);
    expect(res.finished).toBe(true);

    expect(popEventMock).not.toHaveBeenCalled();
  });

  it('respond 400 if body is empty', async () => {
    const receiver = new MetaWebhookReceiver({
      bot,
      platform: 'test',
      objectType: 'foo',
      makeEventsFromUpdate,
      popEventWrapper,
      shouldHandleChallenge: false,
      shouldVerifyRequest: false,
    });
    const req = createReq({ method: 'POST' });
    const res = createRes();

    await receiver.handleRequest(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.finished).toBe(true);
  });

  it('respond 400 if "entry" field is not an array', async () => {
    const receiver = new MetaWebhookReceiver({
      bot,
      platform: 'test',
      objectType: 'foo',
      makeEventsFromUpdate,
      popEventWrapper,
      shouldHandleChallenge: false,
      shouldVerifyRequest: false,
    });

    const req = createReq({
      method: 'POST',
      body: '{"object":"foo"}',
    });
    const res = createRes();

    await receiver.handleRequest(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.finished).toBe(true);

    expect(popEventMock).not.toHaveBeenCalled();
  });

  it('respond 200 and popEvents', async () => {
    const receiver = new MetaWebhookReceiver({
      bot,
      platform: 'test',
      objectType: 'foo',
      makeEventsFromUpdate,
      popEventWrapper,
      shouldHandleChallenge: false,
      shouldVerifyRequest: false,
    });

    const bodyStr = JSON.stringify({
      object: 'foo',
      entry: [{ id: '123' }, { id: '456' }, { id: '789' }],
    });
    const req = createReq({ method: 'POST', url: '/test', body: bodyStr });
    const res = createRes();

    const events = new Array(6).fill(0).map((_, i) => ({
      platform: 'test',
      category: 'foo',
      type: 'bar',
      thread: { platform: 'test', uid: 'foo:123' },
      user: { platform: 'test', uid: 'foo:123' },
      payload: { id: i + 1 },
    }));

    makeEventsFromUpdate.mock.fakeReturnValueOnce(events.slice(0, 1));
    makeEventsFromUpdate.mock.fakeReturnValueOnce(events.slice(1, 3));
    makeEventsFromUpdate.mock.fakeReturnValueOnce(events.slice(3, 6));

    await receiver.handleRequest(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.finished).toBe(true);
    expect(popEventMock).toHaveBeenCalledTimes(6);

    const metadata = {
      source: 'webhook',
      request: { url: '/test', headers: {}, method: 'POST', body: bodyStr },
    };

    popEventMock.calls.forEach(({ args: [context] }, i) => {
      expect(context).toEqual({
        platform: 'test',
        bot,
        event: {
          platform: 'test',
          category: 'foo',
          type: 'bar',
          thread: { platform: 'test', uid: 'foo:123' },
          user: { platform: 'test', uid: 'foo:123' },
          payload: { id: i + 1 },
        },
        metadata,
        reply: expect.any(Function),
      });
    });

    expect(makeEventsFromUpdate).toHaveBeenCalledTimes(3);
    expect(makeEventsFromUpdate).toHaveBeenNthCalledWith(1, { id: '123' });
    expect(makeEventsFromUpdate).toHaveBeenNthCalledWith(2, { id: '456' });
    expect(makeEventsFromUpdate).toHaveBeenNthCalledWith(3, { id: '789' });
  });

  test('passing signature validation', async () => {
    const appSecret = '_MY_SECRET_';
    const receiver = new MetaWebhookReceiver({
      bot,
      platform: 'test',
      objectType: 'foo',
      makeEventsFromUpdate,
      popEventWrapper,
      appSecret,
      shouldHandleChallenge: false,
    });

    const body = '{"object":"foo","entry":[{"id":"1234567890"}]}';
    const hmac = 'd64e2f620fa2ca50e60cd1f2875b6d28aca7c435';

    const req = createReq({
      method: 'POST',
      headers: { 'x-hub-signature': `sha1=${hmac}` },
      body,
    });
    const res = createRes();

    await receiver.handleRequest(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.finished).toBe(true);

    const { event } = popEventMock.calls[0].args[0];
    expect(event).toEqual(defaultEvent);
  });

  it('respond 401 if signature is invalid', async () => {
    const appSecret = '_MY_SECRET_';
    const receiver = new MetaWebhookReceiver({
      bot,
      platform: 'test',
      objectType: 'foo',
      makeEventsFromUpdate,
      popEventWrapper,
      appSecret,
      shouldHandleChallenge: false,
    });

    const body = '{"some":"body"}';
    const hmac = '_WRONG_SIGNATURE_';

    const req = createReq({
      method: 'POST',
      headers: { 'x-hub-signature': `sha1=${hmac}` },
      body,
    });
    const res = createRes();

    await receiver.handleRequest(req, res);

    expect(res.statusCode).toBe(401);
    expect(res.finished).toBe(true);
  });

  describe('context.reply(message)', () => {
    test('call bot.render(event.thread, message)', async () => {
      const receiver = new MetaWebhookReceiver({
        bot,
        platform: 'test',
        objectType: 'foo',
        makeEventsFromUpdate,
        popEventWrapper,
        shouldHandleChallenge: false,
        shouldVerifyRequest: false,
      });

      await receiver.handleRequest(
        createReq({
          method: 'POST',
          body: '{"object":"foo","entry":[{"id":1234567890}]}',
        }),
        createRes()
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

      expect(makeEventsFromUpdate).toHaveBeenCalledTimes(1);
      expect(makeEventsFromUpdate).toHaveBeenCalledWith({
        id: 1234567890,
      });
    });
  });

  test('do nothing when event.thread is null', async () => {
    const receiver = new MetaWebhookReceiver({
      bot,
      platform: 'test',
      objectType: 'foo',
      makeEventsFromUpdate,
      popEventWrapper,
      shouldHandleChallenge: false,
      shouldVerifyRequest: false,
    });

    makeEventsFromUpdate.mock.fakeReturnValue([
      { ...defaultEvent, thread: null },
    ]);

    await receiver.handleRequest(
      createReq({
        method: 'POST',
        body: '{"object":"foo","entry":[{"id":1234567890}]}',
      }),
      createRes()
    );

    expect(popEventMock).toHaveBeenCalledTimes(1);
    const { reply } = popEventMock.calls[0].args[0];

    await expect(reply('hello world')).resolves.toBe(null);
    expect(bot.render).not.toHaveBeenCalled();
  });
});
