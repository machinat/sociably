import type {
  IncomingHttpHeaders,
  IncomingMessage,
  ServerResponse,
} from 'http';
import { Readable } from 'stream';
import moxy, { Mock } from '@moxyjs/moxy';
import type { PopEventWrapper } from '@sociably/core';
import InstagramChat from '../Chat.js';
import InstagramUser from '../User.js';
import { InstagramReceiver } from '../Receiver.js';
import type { InstagramSender } from '../Sender.js';
import type { InstagramEventContext } from '../types.js';

type TestResponse = ServerResponse & {
  finished: boolean;
  statusCode: number;
};

type RequestOptions = {
  method: string;
  url?: string;
  body?: string;
  headers?: IncomingHttpHeaders;
};

const sender = moxy<InstagramSender>({
  render: () => ({ jobs: [], results: [], tasks: [] }),
} as never);

const popEventMock = new Mock();
const popEventWrapper = moxy<PopEventWrapper<InstagramEventContext, null>>(
  (finalHandler) =>
    popEventMock.proxify(((ctx: InstagramEventContext) =>
      finalHandler(ctx)) as never) as never,
);

const createReq = ({
  method,
  url = '/',
  body = '',
  headers = {},
}: RequestOptions): IncomingMessage => {
  const req = new Readable({
    read() {
      if (body) req.push(body);
      req.push(null);
    },
  });
  return Object.assign(req, { method, url, body, headers }) as never;
};

const createRes = () =>
  moxy<TestResponse>({
    finished: false,
    statusCode: 200,
    writeHead(this: TestResponse, code: number) {
      this.statusCode = code;
    },
    end(this: TestResponse, ...args: unknown[]) {
      this.finished = true;
      for (let i = args.length - 1; i >= 0; i -= 1) {
        const callback = args[i];
        if (typeof callback === 'function') callback();
      }
    },
  } as never);

const routingInfo = {
  originalPath: '/webhook/instagram',
  basePath: '/',
  matchedPath: 'webhook/instagram',
  trailingPath: '',
};

beforeEach(() => {
  popEventMock.clear();
  popEventWrapper.mock.clear();
});

describe('handling POST', () => {
  it('respond 404 if "object" field is not "instagram"', async () => {
    const receiver = new InstagramReceiver({
      sender,
      shouldVerifyRequest: false,
      appSecret: '...',
      shouldHandleChallenge: false,
      webhookVerifyToken: '...',
      popEventWrapper,
    });

    const req = createReq({
      method: 'POST',
      body: '{"object":"page","entry":[]}',
    });
    const res = createRes();

    await receiver.handleRequest(req, res, routingInfo);

    expect(res.statusCode).toBe(404);
    expect(res.finished).toBe(true);

    expect(popEventMock).not.toHaveBeenCalled();
  });

  it('respond 200 and popEvents', async () => {
    const receiver = new InstagramReceiver({
      sender,
      popEventWrapper,
      shouldVerifyRequest: false,
      appSecret: '...',
      shouldHandleChallenge: false,
      webhookVerifyToken: '...',
    });

    const body = {
      object: 'instagram',
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

    await receiver.handleRequest(req, res, routingInfo);

    expect(res.statusCode).toBe(200);
    expect(res.finished).toBe(true);

    expect(popEventMock).toHaveBeenCalledTimes(2);

    for (const {
      args: [context],
    } of popEventMock.calls) {
      expect(context.platform).toBe('instagram');
      expect(context.sender).toBe(sender);

      expect(context.event.user).toEqual(new InstagramUser('12345', '67890'));
      expect(context.event.thread).toEqual(
        new InstagramChat('12345', { id: '67890' }),
      );

      expect(context.metadata).toEqual({
        source: 'webhook',
        request: { method: 'POST', url: '/', headers: {}, body: bodyStr },
      });
    }

    const event1 = popEventMock.calls[0].args[0].event;
    expect(event1.kind).toBe('message');
    expect(event1.type).toBe('text');
    expect(event1.payload).toEqual(body.entry[0].messaging[0]);

    const event2 = popEventMock.calls[1].args[0].event;
    expect(event2.kind).toBe('message');
    expect(event2.type).toBe('image');
    expect(event2.payload).toEqual(body.entry[0].messaging[1]);
  });

  it('create thread from optin.user_ref if no sender', async () => {
    const receiver = new InstagramReceiver({
      sender,
      popEventWrapper,
      shouldHandleChallenge: false,
      webhookVerifyToken: '...',
      shouldVerifyRequest: false,
      appSecret: '...',
    });

    const body = {
      object: 'instagram',
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

    await receiver.handleRequest(req, res, routingInfo);

    expect(res.statusCode).toBe(200);
    expect(res.finished).toBe(true);

    expect(popEventMock).toHaveBeenCalledTimes(2);

    const ctx1 = popEventMock.calls[0].args[0];
    expect(ctx1.event.user).toEqual(new InstagramUser('12345', '67890'));
    expect(ctx1.event.thread).toEqual(
      new InstagramChat('12345', { id: '67890' }),
    );

    const ctx2 = popEventMock.calls[1].args[0];
    expect(ctx2.event.user).toBe(null);
    expect(ctx2.event.thread).toEqual(
      new InstagramChat('12345', { user_ref: '<REF_FROM_CHECKBOX_PLUGIN>' }),
    );

    for (const { args } of popEventMock.calls) {
      const [context] = args;
      expect(context.platform).toBe('instagram');
      expect(context.sender).toBe(sender);

      expect(context.event.type).toBe('optin');
      expect(context.metadata).toEqual({
        source: 'webhook',
        request: { method: 'POST', url: '/', headers: {}, body: bodyStr },
      });
    }
  });

  test('context.reply(message)', async () => {
    const receiver = new InstagramReceiver({
      sender,
      popEventWrapper,
      shouldHandleChallenge: false,
      appSecret: '...',
      shouldVerifyRequest: false,
      webhookVerifyToken: '...',
    });

    await receiver.handleRequest(
      createReq({
        method: 'POST',
        body: '{"object":"instagram","entry":[{"id":1234567890,"time":1458692752478,"messaging":[{"sender":{"id":"_PSID_"},"recipient":{"id":1234567890},"message":{"mid":"xxx","text":"foo"}}]}]}',
      }),
      createRes(),
      routingInfo,
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

    expect(sender.render).toHaveBeenCalledTimes(1);
    expect(sender.render).toHaveBeenCalledWith(event.thread, 'hello world');
  });
});
