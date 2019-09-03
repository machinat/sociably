import { IncomingMessage, ServerResponse } from 'http';
import moxy from 'moxy';

import handleWebhook from '../webhook';
import LineChannel from '../channel';

describe('handleWebhook(options)(req, res, body)', () => {
  it.each(['GET', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'UPDATE', 'UPGRADE'])(
    'responds 405 if req.method is %s',
    async method => {
      const req = moxy(new IncomingMessage());
      req.method = method;
      const res = moxy(new ServerResponse({ method }));

      await expect(
        handleWebhook({
          channelId: '_LINE_CHANNEL_ID_',
          shouldValidateRequest: false,
        })(req, res, 'body')
      ).resolves.toBe(null);

      expect(res.statusCode).toBe(405);
      expect(res.finished).toBe(true);
    }
  );

  it('responds 400 if body is empty', async () => {
    const req = moxy(new IncomingMessage());
    req.method = 'POST';
    const res = moxy(new ServerResponse({ method: 'POST' }));

    await expect(
      handleWebhook({
        channelId: '_LINE_CHANNEL_ID_',
        shouldValidateRequest: false,
      })(req, res)
    ).resolves.toBe(null);

    expect(res.statusCode).toBe(400);
    expect(res.finished).toBe(true);
  });

  it('responds 400 if body is not not valid json format', async () => {
    const req = moxy(new IncomingMessage());
    req.method = 'POST';
    const res = moxy(new ServerResponse({ method: 'POST' }));

    await expect(
      handleWebhook({
        channelId: '_LINE_CHANNEL_ID_',
        shouldValidateRequest: false,
      })(req, res, '_invalid_body_')
    ).resolves.toBe(null);

    expect(res.statusCode).toBe(400);
    expect(res.finished).toBe(true);
  });

  it('responds 400 if body is in invalid format', async () => {
    const req = moxy(new IncomingMessage());
    req.method = 'POST';
    const res = moxy(new ServerResponse({ method: 'POST' }));

    await expect(
      handleWebhook({
        channelId: '_LINE_CHANNEL_ID_',
        shouldValidateRequest: false,
      })(req, res, JSON.stringify({ there: 'is no events hahaha' }))
    ).resolves.toBe(null);

    expect(res.statusCode).toBe(400);
    expect(res.finished).toBe(true);
  });

  it('returns events created', async () => {
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

    const eventResults = await handleWebhook({
      channelId: '_LINE_CHANNEL_ID_',
      shouldValidateRequest: false,
    })(req, res, JSON.stringify(body));

    expect(res.statusCode).toBe(200);
    expect(res.finished).toBe(true);

    expect(eventResults.length).toBe(2);

    expect(eventResults).toMatchSnapshot();

    eventResults.forEach(({ event, channel, response }, i) => {
      expect(response).toBe(undefined);

      expect(channel).toBeInstanceOf(LineChannel);
      expect(channel.subtype).toBe('user');
      expect(channel.source).toEqual({
        type: 'user',
        userId: 'U4af4980629',
      });
      expect(channel.uid).toBe('line:_LINE_CHANNEL_ID_:user:U4af4980629');

      expect(event.platform).toBe('line');
      expect(event.type).toBe(!i ? 'message' : 'follow');
      expect(event.subtype).toBe(!i ? 'text' : undefined);
      expect(event.payload).toEqual(body.events[i]);
    });
  });

  it('pass options.channelId to channel', async () => {
    const req = moxy(new IncomingMessage());
    req.method = 'POST';
    const res = moxy(new ServerResponse({ method: 'POST' }));

    const [{ channel }] = await handleWebhook({
      shouldValidateRequest: false,
      channelId: '_my_foo_line_channel_',
    })(
      req,
      res,
      JSON.stringify({
        destination: 'xxxxxxxxxx',
        events: [
          {
            replyToken: '0f3779fba3b349968c5d07db31eab56f',
            type: 'message',
            timestamp: 1462629479859,
            source: { type: 'user', userId: 'U4af4980629' },
            message: { id: '325708', type: 'text', text: 'Hello, world' },
          },
        ],
      })
    );

    expect(channel).toBeInstanceOf(LineChannel);
    expect(channel.subtype).toBe('user');
    expect(channel.uid).toBe('line:_my_foo_line_channel_:user:U4af4980629');
  });

  it('returns events if request validation passed', async () => {
    const req = moxy(new IncomingMessage());
    req.method = 'POST';
    const res = moxy(new ServerResponse({ method: 'POST' }));

    const body =
      '{"destination":"xxx","events":[{"replyToken":"xxx","type":"message","timestamp":1462629479859,"source":{"type":"user","userId":"xxx"},"message":{"id":"325708","type":"text","text":"Hello, world"}}]}';
    const hmac = 'tJIFpuDMyZ4a9XzwkNUBK2B/7NH5gxYJDR/57RCf+6k=';
    req.mock.getter('headers').fakeReturnValue({ 'x-line-signature': hmac });

    const [{ event, channel, response }] = await handleWebhook({
      channelId: '_LINE_CHANNEL_ID_',
      shouldValidateRequest: true,
      channelSecret: '__LINE_CHANNEL_SECRET__',
    })(req, res, body);

    expect(response).toBe(undefined);

    expect(res.statusCode).toBe(200);
    expect(res.finished).toBe(true);

    expect(channel.source).toEqual({ type: 'user', userId: 'xxx' });

    expect(event.platform).toBe('line');
    expect(event.type).toBe('message');
    expect(event.subtype).toBe('text');
    expect(event.payload).toEqual({
      replyToken: 'xxx',
      type: 'message',
      timestamp: 1462629479859,
      source: { type: 'user', userId: 'xxx' },
      message: { id: '325708', type: 'text', text: 'Hello, world' },
    });
  });

  it('responds 401 if request validation failed', async () => {
    const req = moxy(new IncomingMessage());
    req.method = 'POST';
    const res = moxy(new ServerResponse({ method: 'POST' }));

    const body =
      '{"destination":"xxx","events":[{"replyToken":"xxx","type":"message","timestamp":1462629479859,"source":{"type":"user","userId":"xxx"},"message":{"id":"325708","type":"text","text":"Hello, world"}}]}';
    const hmac = '__INVALID_SIGANATURE__';
    req.mock.getter('headers').fakeReturnValue({ 'x-line-signature': hmac });

    await expect(
      handleWebhook({
        channelId: '_LINE_CHANNEL_ID_',
        shouldValidateRequest: true,
        channelSecret: '__LINE_CHANNEL_SECRET__',
      })(req, res, body)
    ).resolves.toBe(null);

    expect(res.statusCode).toBe(401);
    expect(res.finished).toBe(true);
  });
});
