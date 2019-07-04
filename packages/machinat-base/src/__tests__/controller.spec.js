/* eslint-disable no-param-reassign */
import moxy from 'moxy';

import Controller from '../controller';

const options = { foo: 'bar' };

const bot = { name: 'r2d2', send: moxy() };

const channel = {
  platform: 'test',
  type: 'test',
  uid: 'test',
};

beforeEach(() => {
  bot.send.mock.reset();
});

describe('#constructor()', () => {
  it('throws if non function pass as eventMiddlewares', () => {
    const invalidParams = [undefined, null, 1, true, 'foo', {}];

    invalidParams.forEach(p =>
      expect(() => new Controller('test', bot, [p])).toThrow()
    );
  });
});

describe('#eventIssuerThroughMiddlewares(finalHandler)', () => {
  const metadata = { on: 'spaceship' };
  const event = { found: 'Obi-Wan' };
  const finalHandler = moxy(() => Promise.resolve());

  beforeEach(() => {
    finalHandler.mock.clear();
  });

  it('pass frame to finalHandler', async () => {
    const controller = new Controller('test', bot, []);

    const issueEvent = controller.eventIssuerThroughMiddlewares(finalHandler);

    await Promise.all([
      expect(issueEvent(channel, { id: 1 }, metadata)).resolves.toBe(undefined),
      expect(issueEvent(channel, { id: 2 }, metadata)).resolves.toBe(undefined),
      expect(issueEvent(channel, { id: 3 }, metadata)).resolves.toBe(undefined),
    ]);

    expect(finalHandler.mock).toHaveBeenCalledTimes(3);
    for (let i = 1; i < 4; i += 1) {
      expect(finalHandler.mock).toHaveBeenNthCalledWith(i, {
        platform: 'test',
        bot,
        event: { id: i },
        channel,
        metadata,
        reply: expect.any(Function),
      });
    }
  });

  it('returns what finalHandler returns', async () => {
    const controller = new Controller('test', bot, []);

    const issueEvent = controller.eventIssuerThroughMiddlewares(finalHandler);

    finalHandler.mock.fake(() => Promise.resolve('Roger'));
    await expect(issueEvent(channel, event, metadata)).resolves.toBe('Roger');

    expect(finalHandler.mock).toHaveBeenCalledWith({
      platform: 'test',
      bot,
      event,
      channel,
      metadata,
      reply: expect.any(Function),
    });
  });

  it('provide frame.reply(msg, opt) suger', () => {
    const controller = new Controller('test', bot, []);

    const issueEvent = controller.eventIssuerThroughMiddlewares(finalHandler);
    issueEvent(channel, event, metadata);

    const { reply } = finalHandler.mock.calls[0].args[0];

    const frame = { channel, bot };
    const message = "I'll return, I promise.";
    bot.send.mock.fakeReturnValue(['go to cloud city']);

    expect(reply.call(frame, message, options)).toEqual(['go to cloud city']);
    expect(bot.send.mock).toHaveBeenCalledTimes(1);
    expect(bot.send.mock).toHaveBeenCalledWith(channel, message, options);
  });

  it('pass EventFrame through middlewares', async () => {
    finalHandler.mock.fake(() => Promise.resolve('Roger'));

    const expectedFrame = {
      platform: 'test',
      bot,
      event,
      channel,
      metadata,
      reply: expect.any(Function),
    };

    const middleware1 = next => async frame => {
      expect(frame).toEqual(expectedFrame);

      frame.foo = true;
      const result = await next(frame);
      expect(result).toBe('Roger foo bar');

      return `${result} baz`;
    };

    const middleware2 = next => async frame => {
      expect(frame).toEqual({ ...expectedFrame, foo: true });

      frame.bar = true;
      const result = await next(frame);
      expect(result).toBe('Roger foo');

      return `${result} bar`;
    };

    const middleware3 = next => async frame => {
      expect(frame).toEqual({ ...expectedFrame, foo: true, bar: true });

      frame.baz = true;
      const result = await next(frame);
      expect(result).toBe('Roger');

      return `${result} foo`;
    };

    const controller = new Controller('test', bot, [
      middleware1,
      middleware2,
      middleware3,
    ]);

    const issueEvent = controller.eventIssuerThroughMiddlewares(finalHandler);

    finalHandler.mock.fakeReturnValue('Roger');
    await expect(issueEvent(channel, event, metadata)).resolves.toBe(
      'Roger foo bar baz'
    );

    expect(finalHandler.mock).toHaveBeenCalledWith({
      ...expectedFrame,
      foo: true,
      bar: true,
      baz: true,
    });
  });

  it('throw what middleware thrown and bypass finalHandler', async () => {
    const middleware = () => async () => {
      throw new Error('an X-wing crash!');
    };

    const controller = new Controller('test', bot, [middleware]);
    const issueEvent = controller.eventIssuerThroughMiddlewares(finalHandler);

    await expect(issueEvent(channel, event, metadata)).rejects.toThrow(
      'an X-wing crash!'
    );

    expect(finalHandler.mock).not.toHaveBeenCalled();
  });

  it('can bypass the finalHandler in middleware', async () => {
    const middleware = () => async () => 'your droid is being hijacked hahaha';

    const controller = new Controller('test', bot, [middleware]);
    const issueEvent = controller.eventIssuerThroughMiddlewares(finalHandler);

    await expect(issueEvent(channel, event, metadata)).resolves.toBe(
      'your droid is being hijacked hahaha'
    );

    expect(finalHandler.mock).not.toHaveBeenCalled();
  });

  it('can catch error in middleware', async () => {
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

    const controller = new Controller('test', bot, [middleware1, middleware2]);

    const issueEvent = controller.eventIssuerThroughMiddlewares(finalHandler);
    await expect(issueEvent(channel, event, metadata)).resolves.toBe(
      "Oh, it's just trash compactor bug"
    );

    expect(finalHandler.mock).not.toHaveBeenCalled();
  });
});
