import type { IncomingMessage, ServerResponse } from 'http';
import { Readable } from 'stream';
import moxy, { Mock } from '@moxyjs/moxy';
import WhatsAppChat from '../Chat';
import WhatsAppUser from '../User';
import { WhatsAppReceiver } from '../Receiver';
import type { WhatsAppBot } from '../Bot';

const bot = moxy<WhatsAppBot>({
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
  it('respond 404 if "object" field is not "whatsapp_business_account"', async () => {
    const receiver = new WhatsAppReceiver({
      bot,
      popEventWrapper,
      shouldHandleChallenge: false,
      shouldVerifyRequest: false,
    });

    const req = createReq({
      method: 'POST',
      body: '{"object":"whatup~~~","entry":[]}',
    });
    const res = createRes();

    await receiver.handleRequest(req, res);

    expect(res.statusCode).toBe(404);
    expect(res.finished).toBe(true);

    expect(popEventMock).not.toHaveBeenCalled();
  });

  it('respond 200 and popEvents', async () => {
    const receiver = new WhatsAppReceiver({
      bot,
      popEventWrapper,
      shouldHandleChallenge: false,
      shouldVerifyRequest: false,
    });

    const body = {
      object: 'whatsapp_business_account',
      entry: [
        {
          id: 'WHATSAPP_BUSINESS_ACCOUNT_ID',
          changes: [
            {
              value: {
                messaging_product: 'whatsapp',
                metadata: {
                  display_phone_number: '+1 234567890',
                  phone_number_id: '1234567890',
                },
                contacts: [{ profile: { name: 'John' }, wa_id: '9876543210' }],
                messages: [
                  {
                    from: '9876543210',
                    id: 'wamid.ID1',
                    timestamp: 1661242706857,
                    text: { body: 'MESSAGE_BODY' },
                    type: 'text',
                  },
                  {
                    from: '9876543210',
                    id: 'wamid.ID2',
                    timestamp: 1661242706857,
                    type: 'image',
                    image: {
                      caption: 'CAPTION',
                      mime_type: 'image/jpeg',
                      sha256: 'IMAGE_HASH',
                      id: 'ID',
                    },
                  },
                ],
              },
              field: 'messages',
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
      expect(context.platform).toBe('whatsapp');
      expect(context.bot).toBe(bot);

      expect(context.event.user).toEqual(
        new WhatsAppUser('9876543210', { name: 'John' })
      );
      expect(context.event.channel).toEqual(
        new WhatsAppChat('1234567890', '9876543210')
      );

      expect(context.metadata).toEqual({
        source: 'webhook',
        request: { method: 'POST', url: '/', headers: {}, body: bodyStr },
      });
    }

    const event1 = popEventMock.calls[0].args[0].event;
    expect(event1.category).toBe('message');
    expect(event1.type).toBe('text');
    expect(event1.payload).toEqual(body.entry[0].changes[0].value.messages[0]);

    const event2 = popEventMock.calls[1].args[0].event;
    expect(event2.category).toBe('message');
    expect(event2.type).toBe('image');
    expect(event2.payload).toEqual(body.entry[0].changes[0].value.messages[1]);
  });

  test('context.reply(message)', async () => {
    const receiver = new WhatsAppReceiver({
      bot,
      popEventWrapper,
      shouldHandleChallenge: false,
      shouldVerifyRequest: false,
    });

    await receiver.handleRequest(
      createReq({
        method: 'POST',
        body: '{"object":"whatsapp_business_account","entry":[{"id":"WHATSAPP_BUSINESS_ACCOUNT_ID","changes":[{"value":{"messaging_product":"whatsapp","metadata":{"display_phone_number":"+1 234567890","phone_number_id":"1234567890"},"contacts":[{"profile":{"name":"NAME"},"wa_id":"9876543210"}],"messages":[{"from":"9876543210","id":"wamid.ID1","timestamp":1661242706857,"text":{"body":"MESSAGE_BODY"},"type":"text"}]},"field":"messages"}]}]}',
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
