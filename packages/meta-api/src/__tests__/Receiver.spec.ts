import type { IncomingMessage, ServerResponse } from 'http';
import { Readable } from 'stream';
import { moxy } from '@moxyjs/moxy';
import { SociablyEvent } from '@sociably/core';
import MetaWebhookReceiver from '../Receiver.js';

const bot = moxy({
  render: async () => ({ jobs: [], results: [], tasks: [] }),
});

const fooEvent = {
  platform: 'test',
  category: 'foo',
  type: 'message',
  channel: { platform: 'test', uid: 'foo:123' },
  thread: { platform: 'test', uid: 'foo:123' },
  user: { platform: 'test', uid: 'foo:123' },
  payload: { id: '1234567890' },
};

const makeEventsFromUpdate = moxy(() => [fooEvent as SociablyEvent<unknown>]);
const popFooEvent = moxy(async () => null);

const fooListeningPlatformOptions = {
  platform: 'test',
  bot,
  objectType: 'foo',
  makeEventsFromUpdate,
  popEvent: popFooEvent,
};

const popBarEvent = moxy(async () => null);
const barListeningPlatformOptions = {
  platform: 'test2',
  bot,
  objectType: 'bar',
  makeEventsFromUpdate,
  popEvent: popBarEvent,
};

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
  popFooEvent.mock.clear();
  makeEventsFromUpdate.mock.reset();
});

it('throw if appSecret not given', () => {
  expect(
    () =>
      new MetaWebhookReceiver({
        verifyTokenL: '_VERIFY_TOKEN_',
        shouldHandleChallenge: false,
        shouldVerifyRequest: true,
        listeningPlatforms: [
          fooListeningPlatformOptions,
          barListeningPlatformOptions,
        ],
      } as never)
  ).toThrowErrorMatchingInlineSnapshot(
    `"appSecret should not be empty if shouldVerifyRequest set to true"`
  );
});

it('throw if verifyToken not given', () => {
  expect(
    () =>
      new MetaWebhookReceiver({
        appSecret: '_APP_SECRET_',
        shouldHandleChallenge: true,
        shouldVerifyRequest: false,
        listeningPlatforms: [
          fooListeningPlatformOptions,
          barListeningPlatformOptions,
        ],
      } as never)
  ).toThrowErrorMatchingInlineSnapshot(
    `"verifyToken should not be empty if shouldHandleChallenge set to true"`
  );
});

describe('handling GET', () => {
  it('respond 403 if shouldHandleChallenge set to false', async () => {
    const receiver = new MetaWebhookReceiver({
      appSecret: '_APP_SECRET_',
      verifyToken: '_VERIFY_TOKEN_',
      shouldHandleChallenge: false,
      shouldVerifyRequest: true,
      listeningPlatforms: [
        fooListeningPlatformOptions,
        barListeningPlatformOptions,
      ],
    });

    const req = createReq({ method: 'GET' });
    const res = createRes();

    await receiver.handleRequest(req, res);

    expect(res.statusCode).toBe(403);
    expect(res.finished).toBe(true);

    expect(popFooEvent).not.toHaveBeenCalled();
    expect(popBarEvent).not.toHaveBeenCalled();
  });

  it.each(['', 'xxx', 'non_subscribe'])(
    'respond 400 if hub.mode param is not "subscribe"',
    async (mode) => {
      const receiver = new MetaWebhookReceiver({
        appSecret: '_APP_SECRET_',
        verifyToken: '_VERIFY_TOKEN_',
        shouldHandleChallenge: true,
        shouldVerifyRequest: true,
        listeningPlatforms: [
          fooListeningPlatformOptions,
          barListeningPlatformOptions,
        ],
      });

      const req = createReq({
        method: 'GET',
        url: `/?hub.mode=${encodeURIComponent(mode)}`,
      });
      const res = createRes();

      await receiver.handleRequest(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.finished).toBe(true);

      expect(popFooEvent).not.toHaveBeenCalled();
      expect(popBarEvent).not.toHaveBeenCalled();
    }
  );

  it('respond 400 if hub.verify_token param not matched', async () => {
    const receiver = new MetaWebhookReceiver({
      appSecret: '_APP_SECRET_',
      verifyToken: '_VERIFY_TOKEN_',
      shouldHandleChallenge: true,
      shouldVerifyRequest: true,
      listeningPlatforms: [
        fooListeningPlatformOptions,
        barListeningPlatformOptions,
      ],
    });

    const req = createReq({
      method: 'GET',
      url: '/?hub.mode=subscribe&hub.verify_token=_WRONG_TOKEN_',
    });
    const res = createRes();

    await receiver.handleRequest(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.finished).toBe(true);

    expect(popFooEvent).not.toHaveBeenCalled();
    expect(popBarEvent).not.toHaveBeenCalled();
  });

  it('respond 200 and hub.challenge within body', async () => {
    const receiver = new MetaWebhookReceiver({
      appSecret: '_APP_SECRET_',
      verifyToken: '_MY_TOKEN_',
      shouldHandleChallenge: true,
      shouldVerifyRequest: true,
      listeningPlatforms: [
        fooListeningPlatformOptions,
        barListeningPlatformOptions,
      ],
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

    expect(popFooEvent).not.toHaveBeenCalled();
    expect(popBarEvent).not.toHaveBeenCalled();
  });
});

describe('handling POST', () => {
  it('respond 400 if body is empty', async () => {
    const receiver = new MetaWebhookReceiver({
      appSecret: '_APP_SECRET_',
      verifyToken: '_VERIFY_TOKEN_',
      shouldHandleChallenge: false,
      shouldVerifyRequest: false,
      listeningPlatforms: [
        fooListeningPlatformOptions,
        barListeningPlatformOptions,
      ],
    });

    const req = createReq({ method: 'POST' });
    const res = createRes();

    await receiver.handleRequest(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.finished).toBe(true);

    expect(popFooEvent).not.toHaveBeenCalled();
    expect(popBarEvent).not.toHaveBeenCalled();
  });

  it('respond 400 if body is not in valid JSON format', async () => {
    const receiver = new MetaWebhookReceiver({
      appSecret: '_APP_SECRET_',
      verifyToken: '_VERIFY_TOKEN_',
      shouldHandleChallenge: false,
      shouldVerifyRequest: false,
      listeningPlatforms: [
        fooListeningPlatformOptions,
        barListeningPlatformOptions,
      ],
    });

    const req = createReq({ method: 'POST', body: 'I am Jason' });
    const res = createRes();

    await receiver.handleRequest(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.finished).toBe(true);

    expect(popFooEvent).not.toHaveBeenCalled();
    expect(popBarEvent).not.toHaveBeenCalled();
  });

  it('respond 404 if "object" type is not listened', async () => {
    const receiver = new MetaWebhookReceiver({
      appSecret: '_APP_SECRET_',
      verifyToken: '_VERIFY_TOKEN_',
      shouldHandleChallenge: false,
      shouldVerifyRequest: false,
      listeningPlatforms: [
        fooListeningPlatformOptions,
        barListeningPlatformOptions,
      ],
    });

    const req = createReq({
      method: 'POST',
      body: '{"object":"some_other_object_type","entry":[]}',
    });
    const res = createRes();

    await receiver.handleRequest(req, res);

    expect(res.statusCode).toBe(404);
    expect(res.finished).toBe(true);

    expect(popFooEvent).not.toHaveBeenCalled();
    expect(popBarEvent).not.toHaveBeenCalled();
  });

  it('respond 400 if body is empty', async () => {
    const receiver = new MetaWebhookReceiver({
      appSecret: '_APP_SECRET_',
      verifyToken: '_VERIFY_TOKEN_',
      shouldHandleChallenge: false,
      shouldVerifyRequest: false,
      listeningPlatforms: [
        fooListeningPlatformOptions,
        barListeningPlatformOptions,
      ],
    });
    const req = createReq({ method: 'POST' });
    const res = createRes();

    await receiver.handleRequest(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.finished).toBe(true);

    expect(popFooEvent).not.toHaveBeenCalled();
    expect(popBarEvent).not.toHaveBeenCalled();
  });

  it('respond 400 if "entry" field is not an array', async () => {
    const receiver = new MetaWebhookReceiver({
      appSecret: '_APP_SECRET_',
      verifyToken: '_VERIFY_TOKEN_',
      shouldHandleChallenge: false,
      shouldVerifyRequest: false,
      listeningPlatforms: [
        fooListeningPlatformOptions,
        barListeningPlatformOptions,
      ],
    });

    const req = createReq({
      method: 'POST',
      body: '{"object":"foo"}',
    });
    const res = createRes();

    await receiver.handleRequest(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.finished).toBe(true);

    expect(popFooEvent).not.toHaveBeenCalled();
    expect(popBarEvent).not.toHaveBeenCalled();
  });

  it('respond 200 and pop events', async () => {
    const receiver = new MetaWebhookReceiver({
      appSecret: '_APP_SECRET_',
      verifyToken: '_VERIFY_TOKEN_',
      shouldHandleChallenge: false,
      shouldVerifyRequest: false,
      listeningPlatforms: [
        fooListeningPlatformOptions,
        barListeningPlatformOptions,
      ],
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
    expect(popFooEvent).toHaveBeenCalledTimes(6);

    const metadata = {
      source: 'webhook',
      request: { url: '/test', headers: {}, method: 'POST', body: bodyStr },
    };

    popFooEvent.mock.calls.forEach(({ args: [context] }, i) => {
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

    expect(popBarEvent).not.toHaveBeenCalled();
  });

  test('passing signature validation', async () => {
    const receiver = new MetaWebhookReceiver({
      appSecret: '_MY_SECRET_',
      verifyToken: '_VERIFY_TOKEN_',
      shouldHandleChallenge: false,
      shouldVerifyRequest: true,
      listeningPlatforms: [
        fooListeningPlatformOptions,
        barListeningPlatformOptions,
      ],
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

    const { event } = popFooEvent.mock.calls[0].args[0];
    expect(event).toEqual(fooEvent);

    expect(popBarEvent).not.toHaveBeenCalled();
  });

  it('respond 401 if signature is invalid', async () => {
    const receiver = new MetaWebhookReceiver({
      appSecret: '_MY_SECRET_',
      verifyToken: '_VERIFY_TOKEN_',
      shouldHandleChallenge: false,
      shouldVerifyRequest: true,
      listeningPlatforms: [
        fooListeningPlatformOptions,
        barListeningPlatformOptions,
      ],
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

    expect(popFooEvent).not.toHaveBeenCalled();
    expect(popBarEvent).not.toHaveBeenCalled();
  });

  test('with 2 listening platform on a object type', async () => {
    const popFooEvent2 = moxy(async () => null);
    const receiver = new MetaWebhookReceiver({
      appSecret: '_APP_SECRET_',
      verifyToken: '_VERIFY_TOKEN_',
      shouldHandleChallenge: false,
      shouldVerifyRequest: false,
      listeningPlatforms: [
        fooListeningPlatformOptions,
        barListeningPlatformOptions,
        {
          ...fooListeningPlatformOptions,
          platform: 'test3',
          objectType: 'foo',
          popEvent: popFooEvent2,
        },
      ],
    });

    await receiver.handleRequest(
      createReq({
        method: 'POST',
        url: '/test',
        body: '{"object": "foo", "entry": [{ "id": "123" }]}',
      }),
      createRes()
    );

    const expectedFooEventContext = {
      platform: 'test',
      bot,
      event: fooEvent,
      metadata: {
        source: 'webhook',
        request: {
          url: '/test',
          headers: {},
          method: 'POST',
          body: '{"object": "foo", "entry": [{ "id": "123" }]}',
        },
      },
      reply: expect.any(Function),
    };

    expect(popFooEvent).toHaveBeenCalledTimes(1);
    expect(popFooEvent).toHaveBeenCalledWith(expectedFooEventContext);
    expect(popFooEvent2).toHaveBeenCalledTimes(1);
    expect(popFooEvent2).toHaveBeenCalledWith({
      ...expectedFooEventContext,
      platform: 'test3',
    });
    expect(popBarEvent).not.toHaveBeenCalled();
  });

  describe('context.reply(message)', () => {
    test('call bot.render(event.thread, message)', async () => {
      const receiver = new MetaWebhookReceiver({
        appSecret: '_APP_SECRET_',
        verifyToken: '_VERIFY_TOKEN_',
        shouldHandleChallenge: false,
        shouldVerifyRequest: false,
        listeningPlatforms: [
          fooListeningPlatformOptions,
          barListeningPlatformOptions,
        ],
      });

      await receiver.handleRequest(
        createReq({
          method: 'POST',
          body: '{"object":"foo","entry":[{"id":1234567890}]}',
        }),
        createRes()
      );

      expect(popFooEvent).toHaveBeenCalledTimes(1);
      const { reply, event } = popFooEvent.mock.calls[0].args[0];
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

    expect(popBarEvent).not.toHaveBeenCalled();
  });

  test('do nothing when event.thread is null', async () => {
    const receiver = new MetaWebhookReceiver({
      appSecret: '_APP_SECRET_',
      verifyToken: '_VERIFY_TOKEN_',
      shouldHandleChallenge: false,
      shouldVerifyRequest: false,
      listeningPlatforms: [
        fooListeningPlatformOptions,
        barListeningPlatformOptions,
      ],
    });

    makeEventsFromUpdate.mock.fakeReturnValue([{ ...fooEvent, thread: null }]);

    await receiver.handleRequest(
      createReq({
        method: 'POST',
        body: '{"object":"foo","entry":[{"id":1234567890}]}',
      }),
      createRes()
    );

    expect(popFooEvent).toHaveBeenCalledTimes(1);
    const { reply } = popFooEvent.mock.calls[0].args[0];

    await expect(reply('hello world')).resolves.toBe(null);
    expect(bot.render).not.toHaveBeenCalled();

    expect(popBarEvent).not.toHaveBeenCalled();
  });
});
