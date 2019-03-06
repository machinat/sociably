import EventEmitter from 'events';
import moxy from 'moxy';
import Bot from '../bot';

const controller = moxy({
  use: () => controller,
  makeEventHandler: () => () => {},
});

const engine = moxy({
  use: () => engine,
  dispatch: () => 'Vrooooooooooooooom',
  start: () => true,
  stop: () => true,
});

beforeEach(() => {
  controller.mock.clear();
  engine.mock.clear();
});

it('extends EventEmitter', () => {
  expect(new Bot(controller, engine)).toBeInstanceOf(EventEmitter);
});

describe('#constructor(controller, engine, plugins)', () => {
  it('initiats with controller and engine', () => {
    const bot = new Bot(controller, engine);

    expect(bot.controller).toBe(controller);
    expect(bot.engine).toBe(engine);
    expect(engine.start.mock).toHaveBeenCalledTimes(1);
  });

  it('initiats with plugins that generates receive and send middlewares', () => {
    const rmw1 = () => () => {};
    const rmw2 = () => () => {};
    const smw1 = () => () => {};
    const smw2 = () => () => {};
    const plugins = [
      moxy(() => ({ dispatchMiddleware: smw1 })),
      moxy(() => ({ receiveMiddleware: rmw1 })),
      moxy(() => ({ dispatchMiddleware: smw2, receiveMiddleware: rmw2 })),
    ];

    const bot = new Bot(controller, engine, plugins);

    plugins.forEach(pluginFn => {
      expect(pluginFn.mock).toHaveBeenCalledTimes(1);
      expect(pluginFn.mock).toHaveBeenCalledWith(bot);
    });

    expect(controller.use.mock).toHaveBeenCalledWith(rmw1, rmw2);
    expect(engine.use.mock).toHaveBeenCalledWith(smw1, smw2);
  });
});

describe('#eventHandler()', () => {
  it('delegates event to controller.makeEventHandler()', () => {
    const bot = new Bot(controller, engine);

    const handlerFromController = () => {};
    controller.makeEventHandler.mock.fakeReturnValue(handlerFromController);

    const handler = bot.eventHandler();
    expect(handler).toBe(handlerFromController);

    const [
      botArg,
      finalHandler,
      onError,
    ] = controller.makeEventHandler.mock.calls[0].args;

    expect(botArg).toBe(bot);
    expect(typeof finalHandler).toBe('function');
    expect(typeof onError).toBe('function');

    const eventListener = moxy();
    bot.on('event', eventListener);
    const receiveContext = { foo: 'bar' };
    finalHandler(receiveContext);
    expect(eventListener.mock).toHaveBeenCalledWith(receiveContext);

    const errorListener = moxy();
    bot.on('error', errorListener);
    const error = new Error('boom');
    onError(error);
    expect(errorListener.mock).toHaveBeenCalledWith(error);
  });
});
