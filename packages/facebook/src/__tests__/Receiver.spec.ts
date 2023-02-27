import type { IncomingMessage, ServerResponse } from 'http';
import { Readable } from 'stream';
import moxy, { Mock } from '@moxyjs/moxy';
import FacebookChat from '../Chat';
import FacebookUser from '../User';
import { FacebookReceiver } from '../Receiver';
import type { FacebookBot } from '../Bot';

const bot = moxy<FacebookBot>({
  render: () => ({ jobs: [], results: [], tasks: [] }),
} as never);

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
  popEventMock.clear();
  popEventWrapper.mock.clear();
});

describe('handling POST', () => {
  it('respond 404 if "object" field is not "page"', async () => {
    const receiver = new FacebookReceiver({
      bot,
      popEventWrapper,
      shouldHandleChallenge: false,
      shouldVerifyRequest: false,
    });

    const req = createReq({
      method: 'POST',
      body: '{"object":"Pegg","entry":[]}',
    });
    const res = createRes();

    await receiver.handleRequest(req, res);

    expect(res.statusCode).toBe(404);
    expect(res.finished).toBe(true);

    expect(popEventMock).not.toHaveBeenCalled();
  });

  it('respond 200 and popEvents', async () => {
    const receiver = new FacebookReceiver({
      bot,
      popEventWrapper,
      shouldHandleChallenge: false,
      shouldVerifyRequest: false,
    });

    const body = {
      object: 'page',
      entry: [
        {
          id: '12345',
          time: 1458692752478,
          messaging: [
            {
              recipient: { id: '12345' },
              sender: { id: '67890' },
              message: {
                mid: 'xxx',
                text: 'hello',
              },
            },
            {
              recipient: { id: '12345' },
              sender: { id: '67890' },
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
      expect(context.platform).toBe('facebook');
      expect(context.bot).toBe(bot);

      expect(context.event.user).toEqual(new FacebookUser('12345', '67890'));
      expect(context.event.channel).toEqual(
        new FacebookChat('12345', { id: '67890' })
      );

      expect(context.metadata).toEqual({
        source: 'webhook',
        request: { method: 'POST', url: '/', headers: {}, body: bodyStr },
      });
    }

    const event1 = popEventMock.calls[0].args[0].event;
    expect(event1.category).toBe('message');
    expect(event1.type).toBe('text');
    expect(event1.payload).toEqual(body.entry[0].messaging[0]);

    const event2 = popEventMock.calls[1].args[0].event;
    expect(event2.category).toBe('message');
    expect(event2.type).toBe('image');
    expect(event2.payload).toEqual(body.entry[0].messaging[1]);
  });

  it('create channel from optin.user_ref if no sender', async () => {
    const receiver = new FacebookReceiver({
      bot,
      popEventWrapper,
      shouldHandleChallenge: false,
      shouldVerifyRequest: false,
    });

    const body = {
      object: 'page',
      entry: [
        {
          id: '12345',
          time: 1458692752478,
          messaging: [
            {
              sender: { id: '67890' },
              recipient: { id: '12345' },
              optin: {
                ref: '<PASS_THROUGH_PARAM>',
              },
            },
            {
              recipient: { id: '12345' },
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
    expect(ctx1.event.user).toEqual(new FacebookUser('12345', '67890'));
    expect(ctx1.event.channel).toEqual(
      new FacebookChat('12345', { id: '67890' })
    );

    const ctx2 = popEventMock.calls[1].args[0];
    expect(ctx2.event.user).toBe(null);
    expect(ctx2.event.channel).toEqual(
      new FacebookChat('12345', { user_ref: '<REF_FROM_CHECKBOX_PLUGIN>' })
    );

    for (const { args } of popEventMock.calls) {
      const [context] = args;
      expect(context.platform).toBe('facebook');
      expect(context.bot).toBe(bot);

      expect(context.event.type).toBe('optin');
      expect(context.metadata).toEqual({
        source: 'webhook',
        request: { method: 'POST', url: '/', headers: {}, body: bodyStr },
      });
    }
  });

  test('context.reply(message)', async () => {
    const receiver = new FacebookReceiver({
      bot,
      popEventWrapper,
      shouldHandleChallenge: false,
      shouldVerifyRequest: false,
    });

    await receiver.handleRequest(
      createReq({
        method: 'POST',
        body: '{"object":"page","entry":[{"id":1234567890,"time":1458692752478,"messaging":[{"sender":{"id":"_PSID_"},"recipient":{"id":1234567890},"message":{"mid":"xxx","text":"foo"}}]}]}',
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

    expect(bot.render).toHaveBeenCalledTimes(1);
    expect(bot.render).toHaveBeenCalledWith(event.channel, 'hello world');
  });
});
