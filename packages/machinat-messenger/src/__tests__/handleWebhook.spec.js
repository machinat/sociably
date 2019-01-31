import { IncomingMessage, ServerResponse } from 'http';
import moxy from 'moxy';

import handleWebhook from '../handleWebhook';

describe('handling GET request', () => {
  it('respond 403 if shouldVerifyWebhook set to false', () => {
    const req = moxy(new IncomingMessage());
    req.method = 'GET';
    const res = moxy(new ServerResponse({ method: 'GET' }));

    expect(handleWebhook({ shouldVerifyWebhook: false })(req, res)) // alignment
      .toBe(undefined);

    expect(res.statusCode).toBe(403);
    expect(res.finished).toBe(true);
  });

  it.each([undefined, '', 'xxx', 'not subscribe'])(
    'respond 400 if hub.mode param is not "subscribe"',
    mode => {
      const req = moxy(new IncomingMessage());
      req.method = 'GET';
      if (mode) {
        req.mock
          .getter('url')
          .fakeReturnValue(`/?hub.mode=${encodeURIComponent(mode)}`);
      }

      const res = moxy(new ServerResponse({ method: 'GET' }));

      expect(handleWebhook({ shouldVerifyWebhook: true })(req, res)) // alignment
        .toBe(undefined);

      expect(res.statusCode).toBe(400);
      expect(res.finished).toBe(true);
    }
  );

  it('respond 400 if hub.verify_token param not matched', () => {
    const options = { shouldVerifyWebhook: true, verifyToken: '_MY_TOKEN_' };

    const req = moxy(new IncomingMessage());
    req.method = 'GET';
    req.mock
      .getter('url')
      .fakeReturnValue('/?hub.mode=subscribe&hub.verify_token=_WRONG_TOKEN_');

    const res = moxy(new ServerResponse({ method: 'GET' }));

    expect(handleWebhook(options)(req, res)).toBe(undefined);

    expect(res.statusCode).toBe(400);
    expect(res.finished).toBe(true);
  });

  it('respond 200 and hub.challenge within body', () => {
    const options = { shouldVerifyWebhook: true, verifyToken: '_MY_TOKEN_' };

    const req = moxy(new IncomingMessage());
    req.method = 'GET';
    req.mock
      .getter('url')
      .fakeReturnValue(
        '/?hub.mode=subscribe&hub.verify_token=_MY_TOKEN_&hub.challenge=FooBarBazHub'
      );

    const res = moxy(new ServerResponse({ method: 'GET' }));

    expect(handleWebhook(options)(req, res)).toBe(undefined);

    expect(res.statusCode).toBe(200);
    expect(res.finished).toBe(true);

    expect(res.end.mock.calls[0].args[0]).toBe('FooBarBazHub');
  });
});

describe('handling POST request', () => {
  it('respond 400 if body is empty', () => {
    const req = moxy(new IncomingMessage());
    req.method = 'POST';
    const res = moxy(new ServerResponse({ method: 'POST' }));

    expect(handleWebhook()(req, res)).toBe(undefined);

    expect(res.statusCode).toBe(400);
    expect(res.finished).toBe(true);
  });

  it('respond 400 if body is not in valid JSON format', () => {
    const req = moxy(new IncomingMessage());
    req.method = 'POST';
    const res = moxy(new ServerResponse({ method: 'POST' }));

    expect(handleWebhook({})(req, res, 'I am Jason')).toBe(undefined);

    expect(res.statusCode).toBe(400);
    expect(res.finished).toBe(true);
  });

  it('respond 404 if "object" field is not "page"', () => {
    const req = moxy(new IncomingMessage());
    req.method = 'POST';
    const res = moxy(new ServerResponse({ method: 'POST' }));

    expect(handleWebhook({})(req, res, '{"object":"Pegg"}')).toBe(undefined);

    expect(res.statusCode).toBe(404);
    expect(res.finished).toBe(true);
  });

  it('return events retrieved from body', () => {
    const req = moxy(new IncomingMessage());
    req.method = 'POST';
    const res = moxy(new ServerResponse({ method: 'POST' }));

    const body = {
      object: 'page',
      entry: [
        {
          id: '_PAGE_ID_',
          time: 1458692752478,
          messaging: [
            {
              sender: { id: '_PSID_' },
              recipient: { id: '_PAGE_ID_' },
              message: {
                mid: 'xxx',
                text: 'hello',
              },
            },
            {
              sender: { id: '_PSID_' },
              recipient: { id: '_PAGE_ID_' },
              message: {
                mid: 'xxx',
                attachments: [
                  {
                    type: 'image',
                    payload: { url: 'world.jpg' },
                  },
                ],
              },
            },
          ],
        },
      ],
    };

    const events = handleWebhook({})(req, res, JSON.stringify(body));

    expect(res.statusCode).toBe(200);
    expect(res.finished).toBe(false);

    events.forEach((event, i) => {
      expect(event.platform).toBe('messenger');
      expect(event.type).toBe(!i ? 'text' : 'image');
      expect(event.subtype).toBe(null);
      expect(event.raw).toEqual(body.entry[0].messaging[i]);
    });
  });

  it('works if signature validation passed', () => {
    const req = moxy(new IncomingMessage());
    req.method = 'POST';
    const res = moxy(new ServerResponse({ method: 'POST' }));

    const appSecret = '_MY_SECRET_';
    const body =
      '{"object":"page","entry":[{"id":"_PAGE_ID_","time":1458692752478,"messaging":[{"sender":{"id":"_PSID_"},"recipient":{"id":"_PAGE_ID_"},"message":{"mid":"xxx","text":"foo"}}]}]}';
    const hmac = 'd33cd905512168110059fa6b18192ee5e43d9fec';
    const options = { shouldValidateRequest: true, appSecret };

    req.mock
      .getter('headers')
      .fake(() => ({ 'x-hub-signature': `sha1=${hmac}` }));

    const [event] = handleWebhook(options)(req, res, body);

    expect(res.statusCode).toBe(200);
    expect(res.finished).toBe(false);

    expect(event.platform).toBe('messenger');
    expect(event.type).toBe('text');
    expect(event.subtype).toBe(null);
    expect(event.raw).toEqual({
      sender: { id: '_PSID_' },
      recipient: { id: '_PAGE_ID_' },
      message: { mid: 'xxx', text: 'foo' },
    });
  });

  it('respond 401 if signature is invalid', () => {
    const req = moxy(new IncomingMessage());
    req.method = 'POST';
    const res = moxy(new ServerResponse({ method: 'POST' }));

    const appSecret = '_MY_SECRET_';
    const body = '{"some":"body"}';
    const hmac = '_WRONG_SIGNATURE_';
    const options = { shouldValidateRequest: true, appSecret };

    req.mock.getter('headers').fake(() => ({ 'x-hub-signature': hmac }));

    expect(handleWebhook(options)(req, res, body)).toBe(undefined);

    expect(res.statusCode).toBe(401);
    expect(res.finished).toBe(true);
  });

  it('respond 400 if body is empty', () => {
    const req = moxy(new IncomingMessage());
    req.method = 'POST';
    const res = moxy(new ServerResponse({ method: 'POST' }));

    expect(handleWebhook({})(req, res)).toBe(undefined);

    expect(res.statusCode).toBe(400);
    expect(res.finished).toBe(true);
  });
});