/* eslint-disable no-param-reassign */
import moxy from 'moxy';
import Controller from '../controller';

it('is a constructor', () => {
  expect(typeof Controller).toBe('function');
  expect(() => new Controller()).not.toThrow();
});

describe('#setMiddlewares(...middlewares)', () => {
  it('throws if non function passed', () => {
    const controller = new Controller();
    const invalidParams = [undefined, null, 1, true, 'foo', {}];

    invalidParams.forEach(p =>
      expect(() => controller.setMiddlewares(p)).toThrow()
    );
  });

  it('returns the controller itself', () => {
    const controller = new Controller();
    expect(controller.setMiddlewares(async () => {})).toBe(controller);
  });

  it('adds middlewares to controller.middlewares', () => {
    const controller = new Controller();

    const middleware1 = async () => {};
    const middleware2 = async () => {};
    const middleware3 = async () => {};

    controller.setMiddlewares(middleware1, middleware2, middleware3);

    expect(controller.middlewares).toEqual([
      middleware1,
      middleware2,
      middleware3,
    ]);
  });

  it('reset middlewares every time called', () => {
    const controller = new Controller();

    const middleware1 = async () => {};
    const middleware2 = async () => {};
    const middleware3 = async () => {};

    controller.setMiddlewares(middleware1, middleware2);
    expect(controller.middlewares).toEqual([middleware1, middleware2]);

    controller.setMiddlewares(middleware3, middleware2);
    expect(controller.middlewares).toEqual([middleware3, middleware2]);
  });
});

describe('#setFramePrototype(mixin)', () => {
  const mixin = {
    foo: 1,
    get bar() {
      return 2;
    },
    baz() {
      return 3;
    },
  };

  it('return controller itself', () => {
    const controller = new Controller();

    expect(controller.setFramePrototype(mixin)).toBe(controller);
  });

  it('extends controller.frame with basic props', () => {
    const controller = new Controller();

    controller.setFramePrototype(mixin);

    expect(typeof controller.frame.reply).toBe('function');
    expect('platform' in controller.frame).toBe(true);

    expect(controller.frame.foo).toBe(1);
    expect(controller.frame.bar).toBe(2);
    expect(controller.frame.baz()).toBe(3);
  });

  test('frame.reply(msg, opt) calls frame.bot.send(frame.channel, msg, opt)', () => {
    const controller = new Controller();
    const { reply } = controller.frame;

    const channel = { empire: 'strikes back' };
    const bot = moxy({ send: () => ['go to cloud city'] });
    const frame = { channel, bot };
    const options = { stay: 'finish training', leave: 'save leia' };
    const message = "I'll return, I promise.";

    expect(reply.call(frame, message, options)).toEqual(['go to cloud city']);
    expect(bot.send.mock).toHaveBeenCalledTimes(1);
    expect(bot.send.mock).toHaveBeenCalledWith(channel, message, options);
  });

  it('resets frame every time called', () => {
    const controller = new Controller();

    controller.setFramePrototype(mixin);
    controller.setFramePrototype({ hello: 'world' });

    expect(controller.frame.hello).toBe('world');
    expect(controller.frame.foo).toBe(undefined);
    expect(controller.frame.bar).toBe(undefined);
    expect(controller.frame.baz).toBe(undefined);
  });
});

describe('#makeEventHandler(finalHandler, onError)', () => {
  const transport = { on: 'spaceship' };
  const event = { found: 'Obi-Wan' };
  const channel = { a: 'new hope' };
  const finalHandler = moxy(() => Promise.resolve());

  beforeEach(() => {
    finalHandler.mock.clear();
  });

  it('pass frame to finalHandler', async () => {
    const controller = new Controller();

    const handle = controller.makeEventHandler(finalHandler);

    await Promise.all([
      expect(handle(channel, { id: 1 }, transport)).resolves.toBe(undefined),
      expect(handle(channel, { id: 2 }, transport)).resolves.toBe(undefined),
      expect(handle(channel, { id: 3 }, transport)).resolves.toBe(undefined),
    ]);

    expect(finalHandler.mock).toHaveBeenCalledTimes(3);
    for (let i = 1; i < 4; i += 1) {
      expect(finalHandler.mock).toHaveBeenNthCalledWith(i, {
        event: { id: i },
        channel: { a: 'new hope' },
        transport,
      });
    }
  });

  it('returns what finalHandler returns', async () => {
    const controller = new Controller();

    const handle = controller.makeEventHandler(finalHandler);

    finalHandler.mock.fake(() => Promise.resolve('Roger'));
    await expect(handle(channel, event, transport)).resolves.toBe('Roger');

    expect(finalHandler.mock).toHaveBeenCalledWith({
      event,
      channel: { a: 'new hope' },
      transport,
    });
  });

  it('pass EventFrame through middlewares', async () => {
    const controller = new Controller();
    finalHandler.mock.fake(() => Promise.resolve('Roger'));

    const expectedFrame = {
      event,
      channel: { a: 'new hope' },
      transport,
    };

    const middleware1 = next => async frame => {
      expect(frame).toEqual(expectedFrame);
      expect(Object.getPrototypeOf(frame)).toBe(controller.frame);

      frame.foo = true;
      const result = await next(frame);
      expect(result).toBe('Roger foo bar');

      return `${result} baz`;
    };

    const middleware2 = next => async frame => {
      expect(frame).toEqual({ ...expectedFrame, foo: true });
      expect(Object.getPrototypeOf(frame)).toBe(controller.frame);

      frame.bar = true;
      const result = await next(frame);
      expect(result).toBe('Roger foo');

      return `${result} bar`;
    };

    const middleware3 = next => async frame => {
      expect(frame).toEqual({ ...expectedFrame, foo: true, bar: true });
      expect(Object.getPrototypeOf(frame)).toBe(controller.frame);

      frame.baz = true;
      const result = await next(frame);
      expect(result).toBe('Roger');

      return `${result} foo`;
    };

    controller.setMiddlewares(middleware1, middleware2, middleware3);

    const handle = controller.makeEventHandler(finalHandler);

    finalHandler.mock.fakeReturnValue('Roger');
    await expect(handle(channel, event, transport)).resolves.toBe(
      'Roger foo bar baz'
    );

    expect(finalHandler.mock).toHaveBeenCalledWith({
      event,
      channel: { a: 'new hope' },
      transport,
      foo: true,
      bar: true,
      baz: true,
    });
  });

  it('throw what middleware thrown and bypass finalHandler', async () => {
    const controller = new Controller();

    const middleware = () => async () => {
      throw new Error('an X-wing crash!');
    };

    controller.setMiddlewares(middleware);
    const handle = controller.makeEventHandler(finalHandler);

    await expect(handle(channel, event, transport)).rejects.toThrow(
      'an X-wing crash!'
    );

    expect(finalHandler.mock).not.toHaveBeenCalled();
  });

  it('can bypass the finalHandler in middleware', async () => {
    const controller = new Controller();

    const middleware = () => async () => 'your droid is being hijacked hahaha';

    controller.setMiddlewares(middleware);
    const handle = controller.makeEventHandler(finalHandler);

    await expect(handle(channel, event, transport)).resolves.toBe(
      'your droid is being hijacked hahaha'
    );

    expect(finalHandler.mock).not.toHaveBeenCalled();
  });

  it('can catch error in middleware', async () => {
    const controller = new Controller();

    const middleware1 = next => async frame => {
      try {
        return await next(frame);
      } catch (e) {
        return "Oh, it's just trash compactor bug";
      }
    };

    const middleware2 = () => async () => {
      throw new Error('intruder in the ship!');
    };

    controller.setMiddlewares(middleware1, middleware2);
    const handle = controller.makeEventHandler(finalHandler);

    await expect(handle(channel, event, transport)).resolves.toBe(
      "Oh, it's just trash compactor bug"
    );

    expect(finalHandler.mock).not.toHaveBeenCalled();
  });
});
