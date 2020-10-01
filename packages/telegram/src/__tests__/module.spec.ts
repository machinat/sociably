import moxy from '@moxyjs/moxy';
import Machinat from '@machinat/core';
import Base from '@machinat/core/base';
import HTTP from '@machinat/http';
import Telegram from '../module';
import { TelegramReceiver } from '../receiver';
import { TelegramProfiler } from '../profiler';
import { TelegramBot } from '../bot';

it('export interfaces', () => {
  expect(Telegram.Receiver).toBe(TelegramReceiver);
  expect(Telegram.Bot).toBe(TelegramBot);
  expect(Telegram.Profiler).toBe(TelegramProfiler);
  expect(Telegram.CONFIGS_I).toMatchInlineSnapshot(`
    Object {
      "$$multi": false,
      "$$name": "TelegramPlatformConfigsI",
      "$$typeof": Symbol(interface.service.machinat),
    }
  `);
});

describe('initModule(configs)', () => {
  it('create module object', () => {
    const eventMiddlewares = [(ctx, next) => next(ctx)];
    const dispatchMiddlewares = [(ctx, next) => next(ctx)];

    const module = Telegram.initModule({
      botToken: '12345:_BOT_TOKEN_',
      entryPath: '/webhook/telegram',
      secretPath: '_SECRET_',
      authRedirectURL: '/webview/index.html',
      connectionCapicity: 999,
      eventMiddlewares,
      dispatchMiddlewares,
    });

    expect(module.name).toBe('telegram');
    expect(module.mounterInterface).toMatchInlineSnapshot(`
      Object {
        "$$multi": false,
        "$$name": "TelegramPlatformMounterI",
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
      botToken: '12345:_BOT_TOKEN_',
      entryPath: '/webhook/telegram',
      secretPath: '_SECRET_',
      authRedirectURL: '/webview/index.html',
      connectionCapicity: 999,
      eventMiddlewares: [(ctx, next) => next(ctx)],
    };

    const app = Machinat.createApp({
      platforms: [Telegram.initModule(configs)],
    });
    await app.start();

    const [
      bot,
      receiver,
      configsProvided,
      profiler,
      routings,
    ] = app.useServices([
      Telegram.Bot,
      Telegram.Receiver,
      Telegram.CONFIGS_I,
      Telegram.Profiler,
      HTTP.REQUEST_ROUTINGS_I,
    ]);

    expect(bot).toBeInstanceOf(TelegramBot);
    expect(receiver).toBeInstanceOf(TelegramReceiver);
    expect(profiler).toBeInstanceOf(TelegramProfiler);
    expect(configsProvided).toEqual(configs);
    expect(routings).toEqual([
      {
        name: 'telegram',
        path: '/webhook/telegram',
        handler: expect.any(Function),
      },
    ]);
  });

  test('provisions when noServer', async () => {
    const configs = {
      botToken: '12345:_BOT_TOKEN_',
      noServer: true,
    };

    const app = Machinat.createApp({
      platforms: [Telegram.initModule(configs)],
    });
    await app.start();

    const [bot, configsProvided, profiler, routings] = app.useServices([
      Telegram.Bot,
      Telegram.CONFIGS_I,
      Telegram.Profiler,
      HTTP.REQUEST_ROUTINGS_I,
    ]);

    expect(bot).toBeInstanceOf(TelegramBot);
    expect(profiler).toBeInstanceOf(TelegramProfiler);
    expect(configsProvided).toEqual(configs);

    expect(routings).toEqual([]);

    expect(() =>
      app.useServices([Telegram.Receiver])
    ).toThrowErrorMatchingInlineSnapshot(`"TelegramReceiver is not bound"`);
  });

  test('provide base interfaces', async () => {
    const app = Machinat.createApp({
      platforms: [Telegram.initModule({ botToken: '12345:_BOT_TOKEN_' })],
    });
    await app.start();

    const [bot, profiler] = app.useServices([Base.BotI, Base.ProfilerI], {
      platform: 'telegram',
    });

    expect(bot).toBeInstanceOf(TelegramBot);
    expect(profiler).toBeInstanceOf(TelegramProfiler);
  });

  test('default entryPath to "/"', async () => {
    const configs = {
      botToken: '12345:_BOT_TOKEN_',
    };

    const app = Machinat.createApp({
      platforms: [Telegram.initModule(configs)],
    });
    await app.start();

    const [routings] = app.useServices([HTTP.REQUEST_ROUTINGS_I]);
    expect(routings).toEqual([
      { name: 'telegram', path: '/', handler: expect.any(Function) },
    ]);
  });

  test('#startHook() start bot', async () => {
    const bot = moxy({ start: async () => {} });
    const module = Telegram.initModule({
      botToken: '12345:_BOT_TOKEN_',
    });

    const startHook = module.startHook as any;
    await expect(startHook(bot)).resolves.toBe(undefined);
    expect(bot.start.mock).toHaveBeenCalledTimes(1);
  });
});
