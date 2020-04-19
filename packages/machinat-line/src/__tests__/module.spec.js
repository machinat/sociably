import moxy from 'moxy';
import Machinat from '@machinat/core';
import HTTP from '@machinat/http';
import Line from '..';
import LineReceiver from '../receiver';
import LineBot from '../bot';

it('export interfaces', () => {
  expect(Line.Receiver).toBe(LineReceiver);
  expect(Line.Bot).toBe(LineBot);
  expect(Line.CONFIGS_I).toMatchInlineSnapshot(`
    Object {
      "$$multi": false,
      "$$name": "LinePlatformConfigs",
      "$$typeof": Symbol(machinat.services.interface),
    }
  `);
});

describe('initModule(configs)', () => {
  it('create module object', () => {
    const eventMiddlewares = [(ctx, next) => next(ctx)];
    const dispatchMiddlewares = [(ctx, next) => next(ctx)];
    expect(
      Line.initModule({
        channelId: '_CHANNEL_ID_',
        accessToken: '_ACCESS_TOKEN_',
        eventMiddlewares,
        dispatchMiddlewares,
      })
    ).toEqual({
      name: 'line',
      mounterInterface: {
        $$multi: false,
        $$name: 'LinePlatformMounter',
        $$typeof: expect.anything(),
      },
      provisions: expect.any(Array),
      startHook: expect.any(Function),
      eventMiddlewares,
      dispatchMiddlewares,
    });
  });

  test('provisions', async () => {
    const configs = {
      channelId: '_CHANNEL_ID_',
      accessToken: '_ACCESS_TOKEN_',
      channelSecret: '_CHANNEL_SECRET_',
      webhookPath: '/webhook/line',
      eventMiddlewares: [(ctx, next) => next(ctx)],
    };

    const app = Machinat.createApp({
      platforms: [Line.initModule(configs)],
    });
    await app.start();

    const [bot, receiver, configsProvided, routings] = app.useServices([
      Line.Bot,
      Line.Receiver,
      Line.CONFIGS_I,
      HTTP.REQUEST_ROUTINGS_I,
    ]);

    expect(bot).toBeInstanceOf(LineBot);
    expect(receiver).toBeInstanceOf(LineReceiver);
    expect(configsProvided).toEqual(configs);
    expect(routings).toEqual([
      { name: 'line', path: '/webhook/line', handler: expect.any(Function) },
    ]);
  });

  test('default webhookPath to "/"', async () => {
    const configs = {
      channelId: '_CHANNEL_ID_',
      accessToken: '_ACCESS_TOKEN_',
      shouldValidateRequest: false,
    };

    const app = Machinat.createApp({
      platforms: [Line.initModule(configs)],
    });
    await app.start();

    const [routings] = app.useServices([HTTP.REQUEST_ROUTINGS_I]);
    expect(routings).toEqual([
      { name: 'line', path: '/', handler: expect.any(Function) },
    ]);
  });

  test('#startHook() start bot', async () => {
    const bot = moxy({ start: async () => {} });
    const module = Line.initModule({
      /* ... */
    });

    await expect(module.startHook(bot)).resolves.toBe(undefined);
    expect(bot.start.mock).toHaveBeenCalledTimes(1);
  });
});
