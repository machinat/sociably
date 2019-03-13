import EventEmitter from 'events';
import moxy from 'moxy';
import Bot from '../bot';

const adaptor = moxy({
  bind: () => true,
  unbined: () => true,
});

const controller = moxy({
  setMiddlewares: () => controller,
  setFramePrototype: () => controller,
  makeEventHandler: () => () => {},
});

const engine = moxy({
  setMiddlewares: () => engine,
  setFramePrototype: () => engine,
  dispatch: () => 'Vrooooooooooooooom',
  start: () => true,
  stop: () => true,
});

beforeEach(() => {
  adaptor.mock.clear();
  controller.mock.clear();
  engine.mock.clear();
});

it('extends EventEmitter', () => {
  expect(new Bot(adaptor, controller, engine)).toBeInstanceOf(EventEmitter);
});

describe('#constructor(controller, engine, plugins)', () => {
  it('initiats with controller and engine', () => {
    const bot = new Bot(adaptor, controller, engine);

    expect(bot.controller).toBe(controller);
    expect(bot.engine).toBe(engine);
    expect(engine.start.mock).toHaveBeenCalledTimes(1);
  });

  it('starts engine', () => {
    const bot = new Bot(adaptor, controller, engine);

    expect(bot.engine.start.mock).toHaveBeenCalledTimes(1);
  });

  it('setFramePrototype() with "bot" prop of engine and controller', () => {
    const bot = new Bot(adaptor, controller, engine);

    expect(engine.setFramePrototype.mock).toHaveBeenCalledWith({ bot });
    expect(controller.setFramePrototype.mock).toHaveBeenCalledWith({ bot });
  });

  it('makeEventHandler() with events firing and error handling callback', () => {
    const bot = new Bot(adaptor, controller, engine);

    expect(adaptor.bind.mock).toHaveBeenCalledTimes(1);
    expect(adaptor.bind.mock).toHaveBeenCalledWith(
      controller.makeEventHandler.mock.calls[0].result
    );

    const [onEvent, onError] = controller.makeEventHandler.mock.calls[0].args;

    expect(typeof onEvent).toBe('function');
    expect(typeof onError).toBe('function');

    const eventListener = moxy();
    bot.on('event', eventListener);
    const receiveFrame = { foo: 'bar' };
    onEvent(receiveFrame);
    expect(eventListener.mock).toHaveBeenCalledWith(receiveFrame);

    const errorListener = moxy();
    bot.on('error', errorListener);
    const error = new Error('boom');
    onError(error);
    expect(errorListener.mock).toHaveBeenCalledWith(error, bot);
  });

  it('setups controller and engine with middlewares and extenstion from plugins', () => {
    const rmw1 = () => () => {};
    const rmw2 = () => () => {};
    const smw1 = () => () => {};
    const smw2 = () => () => {};
    const plugins = [
      moxy(() => ({
        dispatchMiddleware: smw1,
        eventFrameExtension: { foo: 1 },
      })),
      moxy(() => ({
        eventMiddleware: rmw1,
        dispatchFrameExtension: { foo: 2 },
      })),
      moxy(() => ({
        dispatchMiddleware: smw2,
        eventMiddleware: rmw2,
        dispatchFrameExtension: { bar: 1 },
        eventFrameExtension: { bar: 2 },
      })),
    ];

    const bot = new Bot(adaptor, controller, engine, plugins);

    plugins.forEach(pluginFn => {
      expect(pluginFn.mock).toHaveBeenCalledTimes(1);
      expect(pluginFn.mock).toHaveBeenCalledWith(bot);
    });

    expect(controller.setMiddlewares.mock).toHaveBeenCalledWith(rmw1, rmw2);
    expect(engine.setMiddlewares.mock).toHaveBeenCalledWith(smw1, smw2);

    expect(engine.setFramePrototype.mock).toHaveBeenCalledWith({
      bot,
      foo: 2,
      bar: 1,
    });
    expect(controller.setFramePrototype.mock).toHaveBeenCalledWith({
      bot,
      foo: 1,
      bar: 2,
    });
  });
});
