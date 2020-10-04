import moxy from '@moxyjs/moxy';
import Machinat from '@machinat/core';
import Base from '@machinat/core/base';
import HTTP from '@machinat/http';
import Line from '../module';
import { LineReceiver } from '../receiver';
import { LineProfiler } from '../profiler';
import { LineBot } from '../bot';

it('export interfaces', () => {
  expect(Line.Receiver).toBe(LineReceiver);
  expect(Line.Bot).toBe(LineBot);
  expect(Line.Profiler).toBe(LineProfiler);
  expect(Line.CONFIGS_I).toMatchInlineSnapshot(`
    Object {
      "$$multi": false,
      "$$name": "LinePlatformConfigsI",
      "$$typeof": Symbol(interface.service.machinat),
    }
  `);
});

describe('initModule(configs)', () => {
  it('create module object', () => {
    const eventMiddlewares = [(ctx, next) => next(ctx)];
    const dispatchMiddlewares = [(ctx, next) => next(ctx)];

    const module = Line.initModule({
      providerId: '_PROVIDER_ID_',
      channelId: '_BOT_CHANNEL_ID_',
      accessToken: '_ACCESS_TOKEN_',
      eventMiddlewares,
      dispatchMiddlewares,
    });

    expect(module.name).toBe('line');
    expect(module.mounterInterface).toMatchInlineSnapshot(`
      Object {
        "$$multi": false,
        "$$name": "LinePlatformMounterI",
        "$$typeof": Symbol(interface.service.machinat),
      }
    `);
    expect(module.provisions).toBeInstanceOf(Array);
    expect(typeof module.startHook).toBe('function');
    expect(module.eventMiddlewares).toEqual(eventMiddlewares);
    expect(module.dispatchMiddlewares).toEqual(dispatchMiddlewares);
  });

  test('provisions', async () => {
    const configs = {
      providerId: '_PROVIDER_ID_',
      channelId: '_BOT_CHANNEL_ID_',
      accessToken: '_ACCESS_TOKEN_',
      channelSecret: '_CHANNEL_SECRET_',
      entryPath: '/webhook/line',
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
      Line.Profiler,
      HTTP.REQUEST_ROUTINGS_I,
    ]);

    expect(bot).toBeInstanceOf(LineBot);
    expect(receiver).toBeInstanceOf(LineReceiver);
    expect(profiler).toBeInstanceOf(LineProfiler);
    expect(configsProvided).toEqual(configs);
    expect(routings).toEqual([
      { name: 'line', path: '/webhook/line', handler: expect.any(Function) },
    ]);
  });

  test('provisions when noServer', async () => {
    const configs = {
      providerId: '_PROVIDER_ID_',
      channelId: '_BOT_CHANNEL_ID_',
      accessToken: '_ACCESS_TOKEN_',
      noServer: true,
    };

    const app = Machinat.createApp({
      platforms: [Line.initModule(configs)],
    });
    await app.start();

    const [bot, configsProvided, profiler, routings] = app.useServices([
      Line.Bot,
      Line.CONFIGS_I,
      Line.Profiler,
      HTTP.REQUEST_ROUTINGS_I,
    ]);

    expect(bot).toBeInstanceOf(LineBot);
    expect(profiler).toBeInstanceOf(LineProfiler);
    expect(configsProvided).toEqual(configs);

    expect(routings).toEqual([]);

    expect(() =>
      app.useServices([Line.Receiver])
    ).toThrowErrorMatchingInlineSnapshot(`"LineReceiver is not bound"`);
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

    const [bot, profiler] = app.useServices([Base.BotI, Base.ProfilerI], {
      platform: 'line',
    });

    expect(bot).toBeInstanceOf(LineBot);
    expect(profiler).toBeInstanceOf(LineProfiler);
  });

  test('default entryPath to "/"', async () => {
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