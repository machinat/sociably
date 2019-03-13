import moxy from 'moxy';
import Multiplexer from '../multiplexer';

const adaptor = {
  bind: () => true,
};

const controller = {
  frame: { foo: 0 },
  middlewares: [moxy(), moxy(), moxy()],
  setMiddlewares: () => controller,
  setFramePrototype: () => controller,
  makeEventHandler: () => moxy(),
};

const engine = {
  frame: { foo: 0 },
  middlewares: [moxy(), moxy(), moxy()],
  setMiddlewares: () => engine,
  setFramePrototype: () => engine,
};

const _bot = {
  adaptor,
  controller,
  engine,
  emit: () => true,
};

const bot1 = moxy(_bot);
const bot2 = moxy(_bot);
const bot3 = moxy(_bot);
bot1.id = 1;
bot2.id = 2;
bot3.id = 3;

beforeEach(() => {
  bot1.mock.clear();
  bot2.mock.clear();
  bot3.mock.clear();
});

describe('#wrap(id, bot)', () => {
  it('rebind new eventHander to adaptor', () => {
    const multiplexer = new Multiplexer();

    expect(multiplexer.wrap('bot1', bot1)).toBe(bot1);
    expect(multiplexer.wrap('bot2', bot2)).toBe(bot2);
    expect(multiplexer.wrap('bot3', bot3)).toBe(bot3);

    [bot1, bot2, bot3].forEach(bot => {
      expect(bot.controller.makeEventHandler.mock).toHaveBeenCalledTimes(1);

      const [botArg] = bot.controller.makeEventHandler.mock.calls[0].args;
      expect(botArg).toBe(bot);

      expect(bot.adaptor.bind.mock).toHaveBeenCalledTimes(1);
      expect(bot.adaptor.bind.mock).toHaveBeenCalledWith(
        bot.controller.makeEventHandler.mock.calls[0].result
      );
    });
  });

  it('emit "event" event of wrapped bots with original bot emited', () => {
    const multiplexer = new Multiplexer();
    const eventListner = moxy();
    multiplexer.on('event', eventListner);

    expect(multiplexer.wrap('bot1', bot1)).toBe(bot1);
    expect(multiplexer.wrap('bot2', bot2)).toBe(bot2);
    expect(multiplexer.wrap('bot3', bot3)).toBe(bot3);

    [bot1, bot2, bot3].forEach((bot, i) => {
      expect(bot.controller.makeEventHandler.mock).toHaveBeenCalledTimes(1);

      const onEvent = bot.controller.makeEventHandler.mock.calls[0].args[1];

      const eventFrame = { event: 'ザ・ワールド，時は止まる！' };
      onEvent(eventFrame);

      expect(bot.emit.mock).toHaveBeenCalledTimes(1);
      expect(bot.emit.mock).toHaveBeenCalledWith('event', eventFrame);

      expect(eventListner.mock).toHaveBeenCalledTimes(1 + i);
      expect(eventListner.mock).toHaveBeenCalledWith(eventFrame);
    });
  });

  it('emit "error" event of wrapped bots without original bot emited', () => {
    const multiplexer = new Multiplexer();
    const errorListner = moxy();
    multiplexer.on('error', errorListner);

    expect(multiplexer.wrap('bot1', bot1)).toBe(bot1);
    expect(multiplexer.wrap('bot2', bot2)).toBe(bot2);
    expect(multiplexer.wrap('bot3', bot3)).toBe(bot3);

    [bot1, bot2, bot3].forEach((bot, i) => {
      expect(bot.controller.makeEventHandler.mock).toHaveBeenCalledTimes(1);
      const onError = bot.controller.makeEventHandler.mock.calls[0].args[2];

      const err = new Error('ゴゴゴゴゴゴ');
      onError(err);

      expect(bot.emit.mock).not.toHaveBeenCalled();

      expect(errorListner.mock).toHaveBeenCalledTimes(1 + i);
      expect(errorListner.mock).toHaveBeenCalledWith(err, bot);
    });
  });

  it('add common middlewares and extension to engine & controller', () => {
    const rmw1 = () => () => {};
    const rmw2 = () => () => {};
    const smw1 = () => () => {};
    const smw2 = () => () => {};
    const plugins = [
      moxy(() => ({
        dispatchMiddleware: smw1,
        eventFrameExtension: { foo: 1, bar: 1 },
      })),
      moxy(() => ({
        eventMiddleware: rmw1,
        dispatchFrameExtension: { foo: 2, bar: 2 },
      })),
      moxy(() => ({
        dispatchMiddleware: smw2,
        eventMiddleware: rmw2,
        dispatchFrameExtension: { baz: 3 },
        eventFrameExtension: { baz: 3 },
      })),
    ];

    const multiplexer = new Multiplexer({ plugins });

    expect(multiplexer.wrap('bot1', bot1)).toBe(bot1);
    expect(multiplexer.wrap('bot2', bot2)).toBe(bot2);
    expect(multiplexer.wrap('bot3', bot3)).toBe(bot3);

    [bot1, bot2, bot3].forEach((bot, i) => {
      plugins.forEach(plugin => {
        expect(plugin.mock).toHaveBeenNthCalledWith(i + 1, bot);
      });

      expect(bot.engine.setMiddlewares.mock).toHaveBeenCalledWith(
        smw1,
        smw2,
        ...engine.middlewares
      );
      expect(bot.controller.setMiddlewares.mock).toHaveBeenCalledWith(
        rmw1,
        rmw2,
        ...controller.middlewares
      );

      expect(bot.controller.setFramePrototype.mock).toHaveBeenCalledTimes(1);
      const [eventMixin] = bot.controller.setFramePrototype.mock.calls[0].args;
      expect(eventMixin).toEqual({ foo: 0, bar: 1, baz: 3 });
      expect(typeof eventMixin.getBot).toBe('function');

      expect(bot.engine.setFramePrototype.mock).toHaveBeenCalledTimes(1);
      const [dispatchMixin] = bot.engine.setFramePrototype.mock.calls[0].args;
      expect(dispatchMixin).toEqual({ foo: 0, bar: 2, baz: 3 });
      expect(typeof dispatchMixin.getBot).toBe('function');
    });
  });

  it('add frame.getBot() helper to both event and dispatch frame', () => {
    const multiplexer = new Multiplexer();

    expect(multiplexer.wrap('bot1', bot1)).toBe(bot1);
    expect(multiplexer.wrap('bot2', bot2)).toBe(bot2);
    expect(multiplexer.wrap('bot3', bot3)).toBe(bot3);

    [bot1, bot2, bot3].forEach(bot => {
      const [eventMixin] = bot.controller.setFramePrototype.mock.calls[0].args;
      expect(typeof eventMixin.getBot).toBe('function');
      expect(eventMixin.getBot('bot1')).toBe(bot1);
      expect(eventMixin.getBot('bot2')).toBe(bot2);
      expect(eventMixin.getBot('bot3')).toBe(bot3);

      const [dispathMixin] = bot.engine.setFramePrototype.mock.calls[0].args;
      expect(typeof dispathMixin.getBot).toBe('function');
      expect(dispathMixin.getBot('bot1')).toBe(bot1);
      expect(dispathMixin.getBot('bot2')).toBe(bot2);
      expect(dispathMixin.getBot('bot3')).toBe(bot3);
    });
  });
});

describe('#getBot(id)', () => {
  it('returns the bot wrapped with id', () => {
    const multiplexer = new Multiplexer();

    multiplexer.wrap('bot1', bot1);
    multiplexer.wrap('bot2', bot2);
    multiplexer.wrap('bot3', bot3);

    expect(multiplexer.getBot('bot1')).toBe(bot1);
    expect(multiplexer.getBot('bot2')).toBe(bot2);
    expect(multiplexer.getBot('bot3')).toBe(bot3);
  });
});
