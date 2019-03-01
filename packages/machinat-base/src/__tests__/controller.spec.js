import moxy from 'moxy';
import Controller from '../controller';
import ReceiveContext from '../context';

it('is a constructor', () => {
  expect(typeof Controller).toBe('function');
  expect(() => new Controller()).not.toThrow();
});

describe('#use(middleware)', () => {
  it('throws if non function passed', () => {
    const controller = new Controller();
    const invalidParams = [undefined, null, 1, true, 'foo', {}];

    invalidParams.forEach(p => expect(() => controller.use(p)).toThrow());
  });

  it('returns the controller itself', () => {
    const controller = new Controller();
    expect(controller.use(async () => {})).toBe(controller);
  });

  it('adds middleware function to .middlewares', () => {
    const controller = new Controller();

    const middleware1 = async () => {};
    const middleware2 = async () => {};
    const middleware3 = async () => {};

    controller.use(middleware1, middleware2).use(middleware3);

    expect(controller.middlewares).toEqual([
      middleware1,
      middleware2,
      middleware3,
    ]);
  });
});

describe('#makeEventHandler(bot, finalHandler, onError)', () => {
  const bot = { an: 'droid' };
  const transportCtx = { on: 'spaceship' };
  const event = { found: 'Obi-Wan' };
  const finalHandler = moxy(() => Promise.resolve());
  const onError = moxy();

  beforeEach(() => {
    finalHandler.mock.clear();
    onError.mock.clear();
  });

  it('pass context to finalHandler', async () => {
    const controller = new Controller();

    const handle = controller.makeEventHandler(bot, finalHandler, onError);

    await Promise.all([
      expect(handle({ id: 1 }, 'test', transportCtx)).resolves.toBe(undefined),
      expect(handle({ id: 2 }, 'test', transportCtx)).resolves.toBe(undefined),
      expect(handle({ id: 3 }, 'test', transportCtx)).resolves.toBe(undefined),
    ]);

    expect(finalHandler.mock).toHaveBeenCalledTimes(3);
    for (let i = 0; i < 3; i += 1) {
      expect(finalHandler.mock.calls[i].args[0]).toBeInstanceOf(ReceiveContext);
      expect(finalHandler.mock).toHaveBeenCalledWith({
        bot,
        event: { id: i + 1 },
        source: 'test',
        transportContext: transportCtx,
      });
    }
  });

  it('returns what finalHandler returns', async () => {
    const controller = new Controller();

    const handle = controller.makeEventHandler(bot, finalHandler, onError);

    finalHandler.mock.fake(() => Promise.resolve('Roger'));
    await expect(handle(event, 'test', transportCtx)).resolves.toBe('Roger');

    expect(finalHandler.mock).toHaveBeenCalledWith({
      bot,
      event,
      source: 'test',
      transportContext: transportCtx,
    });
  });

  it('pass receiving context through middlewares', async () => {
    const controller = new Controller();
    finalHandler.mock.fake(() => Promise.resolve('Roger'));

    const expectedContext = {
      bot,
      event,
      source: 'test',
      transportContext: transportCtx,
    };

    const middleware1 = next => async context => {
      expect(context).toEqual(expectedContext);

      const result = await next({ ...context, foo: true });
      expect(result).toBe('Roger foo bar');

      return `${result} baz`;
    };

    const middleware2 = next => async context => {
      expect(context).toEqual({ ...expectedContext, foo: true });

      const result = await next({ ...context, bar: true });
      expect(result).toBe('Roger foo');

      return `${result} bar`;
    };

    const middleware3 = next => async context => {
      expect(context).toEqual({ ...expectedContext, foo: true, bar: true });

      const result = await next({ ...context, baz: true });
      expect(result).toBe('Roger');

      return `${result} foo`;
    };

    controller.use(middleware1, middleware2, middleware3);

    const handle = controller.makeEventHandler(bot, finalHandler, onError);

    finalHandler.mock.fakeReturnValue('Roger');
    await expect(handle(event, 'test', transportCtx)).resolves.toBe(
      'Roger foo bar baz'
    );

    expect(finalHandler.mock).toHaveBeenCalledWith({
      bot,
      event,
      source: 'test',
      transportContext: transportCtx,
      foo: true,
      bar: true,
      baz: true,
    });
  });

  it('pass error thrown in middleware to onError', async () => {
    const controller = new Controller();

    const middleware = () => async () => {
      throw new Error('an X-wing crash!');
    };

    controller.use(middleware);
    const handle = controller.makeEventHandler(bot, finalHandler, onError);

    await expect(handle(event, 'test', transportCtx)).rejects.toThrow(
      'an X-wing crash!'
    );

    expect(finalHandler.mock).not.toHaveBeenCalled();
    expect(onError.mock).toHaveBeenCalledWith(new Error('an X-wing crash!'));
  });

  it('can bypass the finalHandler in middleware', async () => {
    const controller = new Controller();

    const middleware = () => async () => 'your droid is being hijacked hahaha';

    controller.use(middleware);
    const handle = controller.makeEventHandler(bot, finalHandler, onError);

    await expect(handle(event, 'test', transportCtx)).resolves.toBe(
      'your droid is being hijacked hahaha'
    );

    expect(finalHandler.mock).not.toHaveBeenCalled();
    expect(onError.mock).not.toHaveBeenCalled();
  });

  it('can catch error in middleware', async () => {
    const controller = new Controller();

    const middleware1 = next => async ctx => {
      try {
        return await next(ctx);
      } catch (e) {
        return "Oh, it's just trash compactor bug";
      }
    };

    const middleware2 = () => async () => {
      throw new Error('intruder in the ship!');
    };

    controller.use(middleware1, middleware2);
    const handle = controller.makeEventHandler(bot, finalHandler, onError);

    await expect(handle(event, 'test', transportCtx)).resolves.toBe(
      "Oh, it's just trash compactor bug"
    );

    expect(finalHandler.mock).not.toHaveBeenCalled();
    expect(onError.mock).not.toHaveBeenCalled();
  });
});
