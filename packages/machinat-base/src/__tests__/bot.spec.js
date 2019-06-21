import Symbol$observable from 'symbol-observable';
import moxy from 'moxy';
import Queue from 'machinat-queue';
import Bot from '../bot';
import Engine from '../engine';

jest.mock('../engine');

const receiver = moxy({
  bindIssuer: () => true,
  unbinedIssuer: () => true,
});

const renderer = moxy({});

const worker = moxy({
  start: () => true,
  stop: () => true,
});

beforeEach(() => {
  Engine.mock.clear();
  receiver.mock.clear();
  worker.mock.clear();
});

describe('#constructor(platform, receiver, renderer, worker, plugins)', () => {
  it('initiats with props', () => {
    const plugins = [() => ({})];
    const bot = new Bot('test', receiver, renderer, worker, plugins);

    expect(bot.platform).toBe('test');
    expect(bot.plugins).toBe(plugins);
    expect(bot.engine).toBeInstanceOf(Engine);
  });

  it('create engine', () => {
    const bot = new Bot('test', receiver, renderer, worker);

    expect(Engine.mock).toHaveBeenCalledTimes(1);
    expect(Engine.mock).toHaveBeenCalledWith(
      'test',
      bot,
      renderer,
      expect.any(Queue),
      [],
      []
    );

    const engine = Engine.mock.calls[0].instance;
    expect(bot.engine).toBe(engine);
  });

  it('pass middlewares to engine from plugins', () => {
    const eventMiddleware1 = () => () => {};
    const eventMiddleware2 = () => () => {};
    const dispatchMiddleware1 = () => () => {};
    const dispatchMiddleware2 = () => () => {};
    const plugins = [
      moxy(() => ({
        dispatchMiddleware: dispatchMiddleware1,
      })),
      moxy(() => ({
        eventMiddleware: eventMiddleware1,
      })),
      moxy(() => ({
        dispatchMiddleware: dispatchMiddleware2,
        eventMiddleware: eventMiddleware2,
      })),
    ];

    const bot = new Bot('test', receiver, renderer, worker, plugins);

    plugins.forEach(pluginFn => {
      expect(pluginFn.mock).toHaveBeenCalledTimes(1);
      expect(pluginFn.mock).toHaveBeenCalledWith(bot);
    });

    expect(Engine.mock).toHaveBeenCalledWith(
      'test',
      bot,
      renderer,
      expect.any(Queue),
      [eventMiddleware1, eventMiddleware2],
      [dispatchMiddleware1, dispatchMiddleware2]
    );
  });

  it('calls engine.eventIssuer() with callback emitting event', async () => {
    const bot = new Bot('test', receiver, renderer, worker);

    const engine = Engine.mock.calls[0].instance;
    const emitEvent = engine.eventIssuer.mock.calls[0].args[0];

    const eventSpy = moxy();
    bot.onEvent(eventSpy);

    await expect(emitEvent({ foo: 'bar' })).resolves.toBe(undefined);
    expect(eventSpy.mock).toHaveBeenCalledWith({ foo: 'bar' });

    const issueEvent = engine.eventIssuer.mock.calls[0].result;
    expect(receiver.bindIssuer.mock).toHaveBeenCalledWith(
      issueEvent,
      expect.any(Function)
    );
  });

  it('starts worker', () => {
    const bot = new Bot('test', receiver, renderer, worker);

    expect(worker.start.mock).toHaveBeenCalledTimes(1);
    expect(worker.start.mock).toHaveBeenCalledWith(bot.engine.queue);
  });
});

it('issue event frame', async () => {
  const bot = new Bot('test', receiver, renderer, worker);
  const eventListener = moxy();
  bot.onEvent(eventListener);

  const [issueEvent] = receiver.bindIssuer.mock.calls[0].args;

  const channel = { super: 'slam' };
  const event = { a: 'phonecall' };
  const metadata = { champ: 'Johnnnnn Ceeeena!' };

  await expect(issueEvent(channel, event, metadata)).resolves.toBe(undefined);
  expect(eventListener.mock).toHaveBeenCalledTimes(1);
  expect(eventListener.mock).toHaveBeenCalledWith({
    platform: 'test',
    bot,
    channel,
    event,
    metadata,
    reply: expect.any(Function),
  });

  expect(bot.removeEventListener(eventListener)).toBe(true);

  await expect(issueEvent({ foo: 'bar' })).resolves.toBe(undefined);
  expect(eventListener.mock).toHaveBeenCalledTimes(1);

  expect(bot.removeEventListener(eventListener)).toBe(false);
});

it('emit error thrown', () => {
  const bot = new Bot('test', receiver, renderer, worker);
  const errorListener = moxy();
  bot.onError(errorListener);

  const [, issueError] = receiver.bindIssuer.mock.calls[0].args;

  expect(issueError(new Error('NO'))).toBe(undefined);
  expect(errorListener.mock).toHaveBeenCalledTimes(1);
  expect(errorListener.mock).toHaveBeenCalledWith(new Error('NO'));

  expect(bot.removeErrorListener(errorListener)).toBe(true);

  expect(() => issueError(new Error('NO'))).toThrow();
  expect(errorListener.mock).toHaveBeenCalledTimes(1);

  expect(bot.removeErrorListener(errorListener)).toBe(false);
});

it('is observable', () => {
  const bot = new Bot('test', receiver, renderer, worker);

  const observable = bot[Symbol$observable]();
  const observer = {
    next: moxy(),
    error: moxy(),
  };

  const subscription = observable.subscribe(observer);

  const [issueEvent, issueError] = receiver.bindIssuer.mock.calls[0].args;

  issueEvent({ foo: ' bar' }, { hello: 'world' }, { love: 'peace' });
  expect(observer.next.mock).toHaveBeenCalledTimes(1);
  expect(observer.next.mock).toHaveBeenCalledWith({
    platform: 'test',
    bot,
    channel: { foo: ' bar' },
    event: { hello: 'world' },
    metadata: { love: 'peace' },
    reply: expect.any(Function),
  });

  issueError(new Error('NOOO'));
  expect(observer.error.mock).toHaveBeenCalledTimes(1);
  expect(observer.error.mock).toHaveBeenCalledWith(new Error('NOOO'));

  subscription.unsubscribe();

  issueEvent({ foo: ' bar' }, { hello: 'world' }, { love: 'peace' });
  expect(observer.next.mock).toHaveBeenCalledTimes(1);
});
