import moxy from 'moxy';
import Machinat from '@machinat/core';
import Base from '@machinat/core/base';
import HTTP from '@machinat/http';
import Line from '..';
import LineReceiver from '../receiver';
import LineUserProfiler from '../profile';
import LineBot from '../bot';

it('export interfaces', () => {
  expect(Line.Receiver).toBe(LineReceiver);
  expect(Line.Bot).toBe(LineBot);
  expect(Line.UserProfiler).toBe(LineUserProfiler);
  expect(Line.CONFIGS_I).toMatchInlineSnapshot(`
    Object {
      "$$multi": false,
      "$$name": "LinePlatformConfigs",
      "$$typeof": Symbol(machinat.services.interface),
    }
  `);
});

describe('initModule(configs)', () => {
  it('throw if configs.providerId is empty', () => {
    expect(() =>
      Line.initModule({ channelId: '_BOT_CHANNEL_ID_' })
    ).toThrowErrorMatchingInlineSnapshot(
      `"configs.providerId should not be empty"`
    );
  });

  it('throw if configs.channelId is empty', () => {
    expect(() =>
      Line.initModule({ providerId: '_PROVIDER_ID_' })
    ).toThrowErrorMatchingInlineSnapshot(
      `"configs.channelId should not be empty"`
    );
  });

  it('create module object', () => {
    const eventMiddlewares = [(ctx, next) => next(ctx)];
    const dispatchMiddlewares = [(ctx, next) => next(ctx)];
    expect(
      Line.initModule({
        providerId: '_PROVIDER_ID_',
        channelId: '_BOT_CHANNEL_ID_',
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
      providerId: '_PROVIDER_ID_',
      channelId: '_BOT_CHANNEL_ID_',
      accessToken: '_ACCESS_TOKEN_',
      channelSecret: '_CHANNEL_SECRET_',
      webhookPath: '/webhook/line',
      eventMiddlewares: [(ctx, next) => next(ctx)],
    };

    const app = Machinat.createApp({
      platforms: [Line.initModule(configs)],
    });
    await app.start();

    const [
      bot,
      receiver,
      configsProvided,
      profiler,
      routings,
    ] = app.useServices([
      Line.Bot,
      Line.Receiver,
      Line.CONFIGS_I,
      Line.UserProfiler,
      HTTP.REQUEST_ROUTINGS_I,
    ]);

    expect(bot).toBeInstanceOf(LineBot);
    expect(receiver).toBeInstanceOf(LineReceiver);
    expect(profiler).toBeInstanceOf(LineUserProfiler);
    expect(configsProvided).toEqual(configs);
    expect(routings).toEqual([
      { name: 'line', path: '/webhook/line', handler: expect.any(Function) },
    ]);
  });

  test('provide base interfaces', async () => {
    const app = Machinat.createApp({
      platforms: [
        Line.initModule({
          providerId: '_PROVIDER_ID_',
          channelId: '_BOT_CHANNEL_ID_',
          accessToken: '_ACCESS_TOKEN_',
          channelSecret: '_CHANNEL_SECRET_',
        }),
      ],
    });
    await app.start();

    const [bot, profiler] = app.useServices([Base.BotI, Base.UserProfilerI], {
      platform: 'line',
    });

    expect(bot).toBeInstanceOf(LineBot);
    expect(profiler).toBeInstanceOf(LineUserProfiler);
  });

  test('default webhookPath to "/"', async () => {
    const configs = {
      providerId: '_PROVIDER_ID_',
      channelId: '_BOT_CHANNEL_ID_',
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
      providerId: '_PROVIDER_ID_',
      channelId: '_BOT_CHANNEL_ID_',
      accessToken: '_ACCESS_TOKEN_',
      shouldValidateRequest: false,
    });

    await expect(module.startHook(bot)).resolves.toBe(undefined);
    expect(bot.start.mock).toHaveBeenCalledTimes(1);
  });
});
