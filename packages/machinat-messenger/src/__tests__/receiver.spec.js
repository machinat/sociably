import { Readable } from 'stream';
import moxy, { Mock } from 'moxy';
import Channel from '../channel';
import MessengerUser from '../user';
import MessengerReceiver from '../receiver';

const bot = moxy();

const popEventMock = new Mock();
const popEventWrapper = moxy(finalHandler =>
  popEventMock.proxify(ctx => finalHandler(ctx))
);

const createReq = ({ method, url = '/', body = '', headers = {} }) => {
  const req = new Readable({
    read() {
      if (body) req.push(body);
      req.push(null);
    },
  });
  return Object.assign(req, { method, url, body, headers });
};

const createRes = () =>
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
  });

beforeEach(() => {
  popEventMock.clear();
  popEventWrapper.mock.clear();
});

it('throw if appSecret not given', () => {
  expect(
    () =>
      new MessengerReceiver({ shouldHandleVerify: false }, bot, popEventWrapper)
  ).toThrowErrorMatchingInlineSnapshot(
    `"appSecret should not be empty if shouldValidateRequest set to true"`
  );
});

it('throw if verifyToken not given', () => {
  expect(
    () =>
      new MessengerReceiver(
        { shouldValidateRequest: false },
        bot,
        popEventWrapper
      )
  ).toThrowErrorMatchingInlineSnapshot(
    `"verifyToken should not be empty if shouldHandleVerify set to true"`
  );
});

describe('handling GET', () => {
  it('respond 403 if shouldHandleVerify set to false', async () => {
    const receiver = new MessengerReceiver(
      { shouldHandleVerify: false, appSecret: '_APP_SECRET_' },
      bot,
      popEventWrapper
    );

    const req = createReq({ method: 'GET' });
    const res = createRes();

    await receiver.handleRequest(req, res);

    expect(res.statusCode).toBe(403);
    expect(res.finished).toBe(true);

    expect(popEventMock).not.toHaveBeenCalled();
  });

  it.each([undefined, '', 'xxx', 'not subscribe'])(
    'respond 400 if hub.mode param is not "subscribe"',
    async mode => {
      const receiver = new MessengerReceiver(
        { verifyToken: '_MY_TOKEN_', shouldValidateRequest: false },
        bot,
        popEventWrapper
      );

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
    const receiver = new MessengerReceiver(
      { verifyToken: '_MY_TOKEN_', shouldValidateRequest: false },
      bot,
      popEventWrapper
    );

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
    const receiver = new MessengerReceiver(
      { verifyToken: '_MY_TOKEN_', shouldValidateRequest: false },
      bot,
      popEventWrapper
    );

    const req = createReq({
      method: 'GET',
      url:
        '/?hub.mode=subscribe&hub.verify_token=_MY_TOKEN_&hub.challenge=FooBarBazHub',
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
    const receiver = new MessengerReceiver(
      { shouldHandleVerify: false, shouldValidateRequest: false },
      bot,
      popEventWrapper
    );

    const req = createReq({ method: 'POST' });
    const res = createRes();

    await receiver.handleRequest(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.finished).toBe(true);

    expect(popEventMock).not.toHaveBeenCalled();
  });

  it('respond 400 if body is not in valid JSON format', async () => {
    const receiver = new MessengerReceiver(
      { shouldHandleVerify: false, shouldValidateRequest: false },
      bot,
      popEventWrapper
    );

    const req = createReq({ method: 'POST', body: 'I am Jason' });
    const res = createRes();

    await receiver.handleRequest(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.finished).toBe(true);

    expect(popEventMock).not.toHaveBeenCalled();
  });

  it('respond 404 if "object" field is not "page"', async () => {
    const receiver = new MessengerReceiver(
      { shouldHandleVerify: false, shouldValidateRequest: false },
      bot,
      popEventWrapper
    );

    const req = createReq({ method: 'POST', body: '{"object":"Pegg"}' });
    const res = createRes();

    await receiver.handleRequest(req, res);

    expect(res.statusCode).toBe(404);
    expect(res.finished).toBe(true);

    expect(popEventMock).not.toHaveBeenCalled();
  });

  it('respond 200 and popEvents', async () => {
    const receiver = new MessengerReceiver(
      { shouldHandleVerify: false, shouldValidateRequest: false },
      bot,
      popEventWrapper
    );

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

    const bodyStr = JSON.stringify(body);
    const req = createReq({ method: 'POST', body: bodyStr });
    const res = createRes();

    await receiver.handleRequest(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.finished).toBe(true);

    expect(popEventMock).toHaveBeenCalledTimes(2);

    for (const {
      args: [context],
    } of popEventMock.calls) {
      expect(context.platform).toBe('messenger');
      expect(context.bot).toBe(bot);

      expect(context.user).toEqual(new MessengerUser('_PAGE_ID_', '_PSID_'));
      expect(context.channel).toEqual(
        new Channel('_PAGE_ID_', { id: '_PSID_' })
      );

      expect(context.metadata).toEqual({
        source: 'webhook',
        request: { method: 'POST', url: '/', headers: {}, body: bodyStr },
      });
    }

    const event1 = popEventMock.calls[0].args[0].event;
    expect(event1.type).toBe('message');
    expect(event1.subtype).toBe('text');
    expect(event1.payload).toEqual(body.entry[0].messaging[0]);

    const event2 = popEventMock.calls[1].args[0].event;
    expect(event2.type).toBe('message');
    expect(event2.subtype).toBe('image');
    expect(event2.payload).toEqual(body.entry[0].messaging[1]);
  });

  it('create channel from optin.user_ref if sender not included', async () => {
    const receiver = new MessengerReceiver(
      { shouldHandleVerify: false, shouldValidateRequest: false },
      bot,
      popEventWrapper
    );

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

    const bodyStr = JSON.stringify(body);
    const req = createReq({ method: 'POST', body: bodyStr });
    const res = createRes();

    await receiver.handleRequest(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.finished).toBe(true);

    expect(popEventMock).toHaveBeenCalledTimes(2);

    const ctx1 = popEventMock.calls[0].args[0];
    expect(ctx1.user).toEqual(new MessengerUser('_PAGE_ID_', '_PSID_'));
    expect(ctx1.channel).toEqual(new Channel('_PAGE_ID_', { id: '_PSID_' }));

    const ctx2 = popEventMock.calls[1].args[0];
    expect(ctx2.user).toBe(null);
    expect(ctx2.channel).toEqual(
      new Channel('_PAGE_ID_', { user_ref: '<REF_FROM_CHECKBOX_PLUGIN>' })
    );

    for (const { args } of popEventMock.calls) {
      const [context] = args;
      expect(context.platform).toBe('messenger');
      expect(context.bot).toBe(bot);

      expect(context.event.type).toBe('optin');
      expect(context.metadata).toEqual({
        source: 'webhook',
        request: { method: 'POST', url: '/', headers: {}, body: bodyStr },
      });
    }
  });

  it('works if signature validation passed', async () => {
    const appSecret = '_MY_SECRET_';
    const receiver = new MessengerReceiver(
      { appSecret, shouldHandleVerify: false },
      bot,
      popEventWrapper
    );

    const body =
      '{"object":"page","entry":[{"id":"_PAGE_ID_","time":1458692752478,"messaging":[{"sender":{"id":"_PSID_"},"recipient":{"id":"_PAGE_ID_"},"message":{"mid":"xxx","text":"foo"}}]}]}';
    const hmac = 'd33cd905512168110059fa6b18192ee5e43d9fec';

    const req = createReq({
      method: 'POST',
      headers: { 'x-hub-signature': `sha1=${hmac}` },
      body,
    });
    const res = createRes();

    await receiver.handleRequest(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.finished).toBe(true);

    const { channel, user, event } = popEventMock.calls[0].args[0];
    expect(user).toEqual(new MessengerUser('_PAGE_ID_', '_PSID_'));
    expect(channel).toEqual(new Channel('_PAGE_ID_', { id: '_PSID_' }));

    expect(event.platform).toBe('messenger');
    expect(event.type).toBe('message');
    expect(event.subtype).toBe('text');
    expect(event.text).toBe('foo');
  });

  it('respond 401 if signature is invalid', async () => {
    const appSecret = '_MY_SECRET_';
    const receiver = new MessengerReceiver(
      { appSecret, shouldHandleVerify: false },
      bot,
      popEventWrapper
    );

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

  it('respond 400 if body is empty', async () => {
    const receiver = new MessengerReceiver(
      { shouldHandleVerify: false, shouldValidateRequest: false },
      bot,
      popEventWrapper
    );
    const req = createReq({ method: 'POST' });
    const res = createRes();

    await receiver.handleRequest(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.finished).toBe(true);
  });
});
