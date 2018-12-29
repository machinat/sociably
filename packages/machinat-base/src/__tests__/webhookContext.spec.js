import moxy from 'moxy';
import WebhookContext from '../webhookContext';

it('is a contructor', () => {
  expect(typeof WebhookContext).toBe('function');
  expect(() => new WebhookContext()).not.toThrow();
});

describe('#reply()', () => {
  it('make client.send() call', async () => {
    const event = moxy({ thread: { id: 1 } });
    const result = { success: true };
    const client = moxy({ send: () => Promise.resolve(result) });

    const context = new WebhookContext(event, client);
    await expect(context.reply('hello')).resolves.toBe(result);

    await context.reply('world', { some: 'options' });

    expect(client.send.mock) // for alignment
      .toHaveBeenNthCalledWith(1, event.thread, 'hello', undefined);
    expect(client.send.mock) // for alignment
      .toHaveBeenNthCalledWith(2, event.thread, 'world', { some: 'options' });
  });

  it('throw if event.thread is empty', () => {
    const context = new WebhookContext({}, {});

    expect(() => context.reply('fail')).toThrow();
  });
});

describe('#respond()', () => {
  it('configure the response object passed in', () => {
    const response = {};
    const context = new WebhookContext({ shouldRespond: true }, {}, response);

    context.respond(200, 'body');

    expect(response).toEqual({ status: 200, body: 'body' });
  });

  it('throw if event is not shouldRespond', () => {
    const context = new WebhookContext({}, {}, {});

    expect(() => context.respond(200, 'body')).toThrow();
  });

  it('throw if response object is already set before', () => {
    const response = {};
    const ctx1 = new WebhookContext({ shouldRespond: true }, {}, response);
    const ctx2 = new WebhookContext({ shouldRespond: true }, {}, response);

    ctx1.respond(200, 'body');
    expect(() => ctx2.respond(200, 'body')).toThrow();
  });
});
