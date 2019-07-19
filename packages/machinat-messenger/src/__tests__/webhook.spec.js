import { IncomingMessage, ServerResponse } from 'http';
import moxy from 'moxy';

import { handleWebhook, handleResponses } from '../webhook';

describe('handleWebhook(options)(req, res, body)', () => {
  describe('handling GET', () => {
    it('respond 403 if shouldVerifyWebhook set to false', async () => {
      const req = moxy(new IncomingMessage());
      req.method = 'GET';
      const res = moxy(new ServerResponse({ method: 'GET' }));

      await expect(
        handleWebhook({ shouldVerifyWebhook: false })(req, res)
      ).resolves.toBe(null);

      expect(res.statusCode).toBe(403);
      expect(res.finished).toBe(true);
    });

    it.each([undefined, '', 'xxx', 'not subscribe'])(
      'respond 400 if hub.mode param is not "subscribe"',
      async mode => {
        const req = moxy(new IncomingMessage());
        req.method = 'GET';
        if (mode) {
          req.mock
            .getter('url')
            .fakeReturnValue(`/?hub.mode=${encodeURIComponent(mode)}`);
        }

        const res = moxy(new ServerResponse({ method: 'GET' }));

        await expect(
          handleWebhook({ shouldVerifyWebhook: true })(req, res)
        ).resolves.toBe(null);

        expect(res.statusCode).toBe(400);
        expect(res.finished).toBe(true);
      }
    );

    it('respond 400 if hub.verify_token param not matched', async () => {
      const options = { shouldVerifyWebhook: true, verifyToken: '_MY_TOKEN_' };

      const req = moxy(new IncomingMessage());
      req.method = 'GET';
      req.mock
        .getter('url')
        .fakeReturnValue('/?hub.mode=subscribe&hub.verify_token=_WRONG_TOKEN_');

      const res = moxy(new ServerResponse({ method: 'GET' }));

      await expect(handleWebhook(options)(req, res)).resolves.toBe(null);

      expect(res.statusCode).toBe(400);
      expect(res.finished).toBe(true);
    });

    it('respond 200 and hub.challenge within body', async () => {
      const options = { shouldVerifyWebhook: true, verifyToken: '_MY_TOKEN_' };

      const req = moxy(new IncomingMessage());
      req.method = 'GET';
      req.mock
        .getter('url')
        .fakeReturnValue(
          '/?hub.mode=subscribe&hub.verify_token=_MY_TOKEN_&hub.challenge=FooBarBazHub'
        );

      const res = moxy(new ServerResponse({ method: 'GET' }));

      await expect(handleWebhook(options)(req, res)).resolves.toBe(null);

      expect(res.statusCode).toBe(200);
      expect(res.finished).toBe(true);

      expect(res.end.mock.calls[0].args[0]).toBe('FooBarBazHub');
    });
  });

  describe('handling POST', () => {
    it('respond 400 if body is empty', async () => {
      const req = moxy(new IncomingMessage());
      req.method = 'POST';
      const res = moxy(new ServerResponse({ method: 'POST' }));

      await expect(handleWebhook({})(req, res)).resolves.toBe(null);

      expect(res.statusCode).toBe(400);
      expect(res.finished).toBe(true);
    });

    it('respond 400 if body is not in valid JSON format', async () => {
      const req = moxy(new IncomingMessage());
      req.method = 'POST';
      const res = moxy(new ServerResponse({ method: 'POST' }));

      await expect(handleWebhook({})(req, res, 'I am Jason')).resolves.toBe(
        null
      );

      expect(res.statusCode).toBe(400);
      expect(res.finished).toBe(true);
    });

    it('respond 404 if "object" field is not "page"', async () => {
      const req = moxy(new IncomingMessage());
      req.method = 'POST';
      const res = moxy(new ServerResponse({ method: 'POST' }));

      await expect(
        handleWebhook({})(req, res, '{"object":"Pegg"}')
      ).resolves.toBe(null);

      expect(res.statusCode).toBe(404);
      expect(res.finished).toBe(true);
    });

    it('return events retrieved from body', async () => {
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

      const eventReports = await handleWebhook({})(
        req,
        res,
        JSON.stringify(body)
      );

      expect(res.statusCode).toBe(200);
      expect(res.finished).toBe(true);

      eventReports.forEach(({ channel, event, response }, i) => {
        expect(response).toBe(undefined);
        expect(channel.source).toEqual({ id: '_PSID_' });

        expect(event.platform).toBe('messenger');
        expect(event.type).toBe('message');
        expect(event.subtype).toBe(!i ? 'text' : 'image');
        expect(event.payload).toEqual(body.entry[0].messaging[i]);
      });
    });

    it('remain res open if payment_pre_checkout event received', async () => {
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
                pre_checkout: {
                  payload: 'xyz',
                  requested_user_info: {
                    shipping_address: {
                      name: 'Tao Jiang',
                      street_1: '600 Edgewater Blvd',
                      street_2: '',
                      city: 'Foster City',
                      state: 'CA',
                      country: 'US',
                      postal_code: '94404',
                    },
                    contact_name: 'Tao Jiang',
                  },
                  amount: {
                    currency: 'USD',
                    amount: '2.70',
                  },
                },
              },
            ],
          },
        ],
      };

      const eventReports = await handleWebhook({})(
        req,
        res,
        JSON.stringify(body)
      );

      expect(res.statusCode).toBe(200);
      expect(res.finished).toBe(false);

      expect(eventReports.length).toBe(1);
      const [{ event, channel, response }] = eventReports;

      expect(response).toBe(undefined);
      expect(channel.source).toEqual({ id: '_PSID_' });

      expect(event.platform).toBe('messenger');
      expect(event.type).toBe('pre_checkout');
      expect(event.subtype).toBe(undefined);
      expect(event.payload).toEqual(body.entry[0].messaging[0]);
    });

    it('remain res open if checkout_update event received', async () => {
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
                checkout_update: {
                  payload: 'DEVELOPER_DEFINED_PAYLOAD',
                  shipping_address: {
                    id: 10105655000959552,
                    country: 'US',
                    city: 'MENLO PARK',
                    street1: '1 Hacker Way',
                    street2: '',
                    state: 'CA',
                    postal_code: '94025',
                  },
                },
              },
            ],
          },
        ],
      };

      const eventReports = await handleWebhook({})(
        req,
        res,
        JSON.stringify(body)
      );

      expect(res.statusCode).toBe(200);
      expect(res.finished).toBe(false);

      expect(eventReports.length).toBe(1);
      const [{ channel, event, response }] = eventReports;

      expect(response).toBe(undefined);
      expect(channel.source).toEqual({ id: '_PSID_' });

      expect(event.platform).toBe('messenger');
      expect(event.type).toBe('checkout_update');
      expect(event.subtype).toBe(undefined);
      expect(event.payload).toEqual(body.entry[0].messaging[0]);
    });

    it('create channel from optin.user_ref if sender not included', async () => {
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
                optin: {
                  ref: '<PASS_THROUGH_PARAM>',
                },
              },
              {
                recipient: { id: '_PAGE_ID_' },
                optin: {
                  ref: '<PASS_THROUGH_PARAM>',
                  user_ref: '<REF_FROM_CHECKBOX_PLUGIN>',
                },
              },
            ],
          },
        ],
      };

      const events = await handleWebhook({})(req, res, JSON.stringify(body));

      expect(res.statusCode).toBe(200);
      expect(res.finished).toBe(true);

      events.forEach(({ channel, event, response }, i) => {
        expect(response).toBe(undefined);
        expect(channel.source).toEqual(
          i === 0
            ? { id: '_PSID_' }
            : { user_ref: '<REF_FROM_CHECKBOX_PLUGIN>' }
        );

        expect(event.platform).toBe('messenger');
        expect(event.type).toBe('optin');
        expect(event.subtype).toBe(undefined);
        expect(event.payload).toEqual(body.entry[0].messaging[i]);
      });
    });

    it('works if signature validation passed', async () => {
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

      const [{ event, channel, response }] = await handleWebhook(options)(
        req,
        res,
        body
      );

      expect(res.statusCode).toBe(200);
      expect(res.finished).toBe(true);

      expect(response).toBe(undefined);
      expect(channel.source).toEqual({ id: '_PSID_' });

      expect(event.platform).toBe('messenger');
      expect(event.type).toBe('message');
      expect(event.subtype).toBe('text');
      expect(event.payload).toEqual({
        sender: { id: '_PSID_' },
        recipient: { id: '_PAGE_ID_' },
        message: { mid: 'xxx', text: 'foo' },
      });
    });

    it('respond 401 if signature is invalid', async () => {
      const req = moxy(new IncomingMessage());
      req.method = 'POST';
      const res = moxy(new ServerResponse({ method: 'POST' }));

      const appSecret = '_MY_SECRET_';
      const body = '{"some":"body"}';
      const hmac = '_WRONG_SIGNATURE_';
      const options = { shouldValidateRequest: true, appSecret };

      req.mock.getter('headers').fake(() => ({ 'x-hub-signature': hmac }));

      await expect(handleWebhook(options)(req, res, body)).resolves.toBe(null);

      expect(res.statusCode).toBe(401);
      expect(res.finished).toBe(true);
    });

    it('respond 400 if body is empty', async () => {
      const req = moxy(new IncomingMessage());
      req.method = 'POST';
      const res = moxy(new ServerResponse({ method: 'POST' }));

      await expect(handleWebhook({})(req, res)).resolves.toBe(null);

      expect(res.statusCode).toBe(400);
      expect(res.finished).toBe(true);
    });
  });
});

describe('handleResponses()(req, res, reports)', () => {
  it('end res with response of pre_checkout event', async () => {
    const req = moxy(new IncomingMessage());
    const res = moxy(new ServerResponse({ method: 'POST' }));

    await expect(
      handleResponses()(req, res, [
        {
          channel: { foo: 'bar' },
          event: {
            platform: 'messenger',
            type: 'pre_checkout',
          },
          response: {
            murmur:
              "fb remove it from doc so i don't know what this should look like :(",
          },
        },
      ])
    ).resolves.toBe(undefined);

    expect(res.statusCode).toBe(200);
    expect(res.end.mock).toHaveBeenCalledTimes(1);
    expect(res.end.mock.calls[0].args[0]).toMatchInlineSnapshot(
      `"{\\"murmur\\":\\"fb remove it from doc so i don't know what this should look like :(\\"}"`
    );
  });

  it('end res with response of checkout_update event', async () => {
    const req = moxy(new IncomingMessage());
    const res = moxy(new ServerResponse({ method: 'POST' }));

    await expect(
      handleResponses()(req, res, [
        {
          channel: { foo: 'bar' },
          event: {
            platform: 'messenger',
            type: 'checkout_update',
          },
          response: {
            murmur:
              "fb remove it from doc so i don't know what this should look like :(",
          },
        },
      ])
    ).resolves.toBe(undefined);

    expect(res.statusCode).toBe(200);
    expect(res.end.mock).toHaveBeenCalledTimes(1);
    expect(res.end.mock.calls[0].args[0]).toMatchInlineSnapshot(
      `"{\\"murmur\\":\\"fb remove it from doc so i don't know what this should look like :(\\"}"`
    );
  });

  it('end res with 501 if no response of checkout_update or pre_checkout event', async () => {
    for (const type of ['checkout_update', 'pre_checkout']) {
      const req = moxy(new IncomingMessage());
      const res = moxy(new ServerResponse({ method: 'POST' }));
      // eslint-disable-next-line no-await-in-loop
      await expect(
        handleResponses()(req, res, [
          {
            channel: { foo: 'bar' },
            event: { platform: 'messenger', type },
            response: undefined,
          },
        ])
      ).resolves.toBe(undefined);

      expect(res.statusCode).toBe(501);
      expect(res.end.mock).toHaveBeenCalledTimes(1);
    }
  });

  it('end res with 200 if no pre_checkout or checkout_update found', async () => {
    const req = moxy(new IncomingMessage());
    const res = moxy(new ServerResponse({ method: 'POST' }));

    await expect(
      handleResponses()(req, res, [
        {
          channel: { foo: 'bar' },
          event: {
            platform: 'messenger',
            type: 'text',
            payload: '...',
          },
          response: undefined,
        },
      ])
    ).resolves.toBe(undefined);

    expect(res.statusCode).toBe(200);
    expect(res.end.mock).toHaveBeenCalledTimes(1);
    expect(res.end.mock.calls[0].args[0]).toBe(undefined);
  });
});
