import moxy from 'moxy';
import { Controller } from 'machinat-base';
import NextBot from '../bot';
import Receiver from '../receiver';

const nextApp = moxy();

jest.mock('machinat-base');
jest.mock('../receiver', () =>
  jest.requireActual('moxy').default(jest.requireActual('../receiver'))
);

beforeEach(() => {
  Controller.mock.clear();
  Receiver.mock.clear();
});

describe('#constructor(options)', () => {
  it('throw if nextApp option not provided', () => {
    expect(() => new NextBot()).toThrowErrorMatchingInlineSnapshot(
      `"options.nextApp should not be empty"`
    );
    expect(() => new NextBot({})).toThrowErrorMatchingInlineSnapshot(
      `"options.nextApp should not be empty"`
    );
  });

  it('assemble core modules', () => {
    const bot = new NextBot({ nextApp });

    expect(bot.controller).toBeInstanceOf(Controller);
    expect(bot.receiver).toBeInstanceOf(Receiver);

    expect(Controller.mock).toHaveBeenCalledTimes(1);
    expect(Controller.mock).toHaveBeenCalledWith('next', bot, []);

    expect(Receiver.mock).toHaveBeenCalledTimes(1);
    expect(Receiver.mock).toHaveBeenCalledWith(nextApp);
  });

  it('pass middlewares from plugins to controller and engine', () => {
    const eventMiddleware1 = () => () => {};
    const eventMiddleware2 = () => () => {};
    const plugins = [
      moxy(() => ({ eventMiddleware: eventMiddleware1 })),
      moxy(() => ({ eventMiddleware: eventMiddleware2 })),
    ];

    const bot = new NextBot({ nextApp, plugins });

    expect(Controller.mock).toHaveBeenCalledWith('next', bot, [
      eventMiddleware1,
      eventMiddleware2,
    ]);
  });

  it('issue event & error', async () => {
    const payload = { pathname: '/hello', query: { foo: 'bar' } };

    const eventIssuerSpy = moxy(() => Promise.resolve(payload));
    Controller.mock.fake(function FakeController() {
      return { eventIssuerThroughMiddlewares: () => eventIssuerSpy };
    });

    const bot = new NextBot({ nextApp });

    const eventListener = moxy();
    const errorListener = moxy();
    bot.onEvent(eventListener);
    bot.onError(errorListener);

    expect(bot.receiver.bindIssuer.mock).toHaveBeenCalledTimes(1);
    expect(
      bot.controller.eventIssuerThroughMiddlewares.mock
    ).toHaveBeenCalledTimes(1);
    const finalPublisher =
      bot.controller.eventIssuerThroughMiddlewares.mock.calls[0].args[0];

    const channel = { platform: 'next', type: 'server' };
    const event = { platform: 'next', type: 'request', payload };
    const metadata = { source: 'next', request: '...' };
    const frame = { channel, event, metadata };

    expect(finalPublisher(frame)).toBe(payload);

    expect(eventListener.mock).toHaveBeenCalledTimes(1);
    expect(eventListener.mock).toHaveBeenCalledWith(frame);

    const [issueEvent, issueError] = bot.receiver.bindIssuer.mock.calls[0].args;

    await expect(issueEvent(channel, event, metadata)).resolves.toBe(payload);
    expect(eventIssuerSpy.mock).toHaveBeenCalledTimes(1);
    expect(eventIssuerSpy.mock).toHaveBeenCalledWith(channel, event, metadata);

    expect(issueError(new Error('NO'))).toBe(undefined);
    expect(errorListener.mock).toHaveBeenCalledTimes(1);
    expect(errorListener.mock).toHaveBeenCalledWith(new Error('NO'));
  });
});

describe('send()', () => {
  it('throw', () => {
    const bot = new NextBot({ nextApp });
    expect(() => bot.send()).toThrowErrorMatchingInlineSnapshot(
      `"can't call send() on next server bot"`
    );
  });
});