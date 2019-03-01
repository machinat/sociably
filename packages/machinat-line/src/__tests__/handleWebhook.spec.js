import { IncomingMessage, ServerResponse } from 'http';
import moxy from 'moxy';

import handleWebhook from '../handleWebhook';

it.each(['GET', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'UPDATE', 'UPGRADE'])(
  'responds 405 if req.method is %s',
  method => {
    const req = moxy(new IncomingMessage());
    req.method = method;
    const res = moxy(new ServerResponse({ method }));

    expect(
      handleWebhook({ shouldValidateRequest: false })(req, res, 'body')
    ).toBe(undefined);

    expect(res.statusCode).toBe(405);
    expect(res.finished).toBe(true);
  }
);

it('responds 400 if body is empty', () => {
  const req = moxy(new IncomingMessage());
  req.method = 'POST';
  const res = moxy(new ServerResponse({ method: 'POST' }));

  expect(handleWebhook({ shouldValidateRequest: false })(req, res)).toBe(
    undefined
  );

  expect(res.statusCode).toBe(400);
  expect(res.finished).toBe(true);
});

it('responds 400 if body is not not valid json format', () => {
  const req = moxy(new IncomingMessage());
  req.method = 'POST';
  const res = moxy(new ServerResponse({ method: 'POST' }));

  expect(
    handleWebhook({ shouldValidateRequest: false })(req, res, '_invalid_body_')
  ).toBe(undefined);

  expect(res.statusCode).toBe(400);
  expect(res.finished).toBe(true);
});

it('responds 400 if body is in invalid format', () => {
  const req = moxy(new IncomingMessage());
  req.method = 'POST';
  const res = moxy(new ServerResponse({ method: 'POST' }));

  expect(
    handleWebhook({ shouldValidateRequest: false })(
      req,
      res,
      JSON.stringify({ there: 'is no events hahaha' })
    )
  ).toBe(undefined);

  expect(res.statusCode).toBe(400);
  expect(res.finished).toBe(true);
});

it('returns events created', () => {
  const req = moxy(new IncomingMessage());
  req.method = 'POST';
  const res = moxy(new ServerResponse({ method: 'POST' }));

  const body = {
    destination: 'xxxxxxxxxx',
    events: [
      {
        replyToken: '0f3779fba3b349968c5d07db31eab56f',
        type: 'message',
        timestamp: 1462629479859,
        source: {
          type: 'user',
          userId: 'U4af4980629...',
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
          userId: 'U4af4980629...',
        },
      },
    ],
  };

  const events = handleWebhook({ shouldValidateRequest: false })(
    req,
    res,
    JSON.stringify(body)
  );

  expect(res.statusCode).toBe(200);
  expect(res.finished).toBe(false);

  expect(events.length).toBe(2);

  events.forEach((event, i) => {
    expect(event.platform).toBe('line');
    expect(event.type).toBe(!i ? 'text' : 'follow');
    expect(event.subtype).toBe(undefined);
    expect(event.raw).toEqual(body.events[i]);
  });
});

it('returns events if request validation passed', () => {
  const req = moxy(new IncomingMessage());
  req.method = 'POST';
  const res = moxy(new ServerResponse({ method: 'POST' }));

  const body =
    '{"destination":"xxx","events":[{"replyToken":"xxx","type":"message","timestamp":1462629479859,"source":{"type":"user","userId":"xxx"},"message":{"id":"325708","type":"text","text":"Hello, world"}}]}';
  const hmac = 'tJIFpuDMyZ4a9XzwkNUBK2B/7NH5gxYJDR/57RCf+6k=';
  req.mock.getter('headers').fakeReturnValue({ 'x-line-signature': hmac });

  const [event] = handleWebhook({
    shouldValidateRequest: true,
    channelSecret: '__LINE_CHANNEL_SECRET__',
  })(req, res, body);

  expect(res.statusCode).toBe(200);
  expect(res.finished).toBe(false);

  expect(event.platform).toBe('line');
  expect(event.type).toBe('text');
  expect(event.subtype).toBe(undefined);
  expect(event.raw).toEqual({
    replyToken: 'xxx',
    type: 'message',
    timestamp: 1462629479859,
    source: { type: 'user', userId: 'xxx' },
    message: { id: '325708', type: 'text', text: 'Hello, world' },
  });
});

it('responds 401 if request validation failed', () => {
  const req = moxy(new IncomingMessage());
  req.method = 'POST';
  const res = moxy(new ServerResponse({ method: 'POST' }));

  const body =
    '{"destination":"xxx","events":[{"replyToken":"xxx","type":"message","timestamp":1462629479859,"source":{"type":"user","userId":"xxx"},"message":{"id":"325708","type":"text","text":"Hello, world"}}]}';
  const hmac = '__INVALID_SIGANATURE__';
  req.mock.getter('headers').fakeReturnValue({ 'x-line-signature': hmac });

  expect(
    handleWebhook({
      shouldValidateRequest: true,
      channelSecret: '__LINE_CHANNEL_SECRET__',
    })(req, res, body)
  ).toBe(undefined);

  expect(res.statusCode).toBe(401);
  expect(res.finished).toBe(true);
});
