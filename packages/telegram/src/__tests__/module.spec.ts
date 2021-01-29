import moxy from '@moxyjs/moxy';
import Machinat from '@machinat/core';
import Base from '@machinat/core/base';
import Http from '@machinat/http';
import Telegram from '../module';
import {
  TelegramChat,
  TelegramChatInstance,
  TelegramChatTarget,
} from '../channel';
import TelegramUser from '../user';
import { TelegramReceiver } from '../receiver';
import {
  TelegramProfiler,
  TelegramUserProfile,
  TelegramChatProfile,
} from '../profiler';
import { TelegramBot } from '../bot';

it('export interfaces', () => {
  expect(Telegram.Receiver).toBe(TelegramReceiver);
  expect(Telegram.Bot).toBe(TelegramBot);
  expect(Telegram.Profiler).toBe(TelegramProfiler);
  expect(Telegram.ConfigsI).toMatchInlineSnapshot(`
    Object {
      "$$multi": false,
      "$$name": "TelegramConfigsI",
      "$$polymorphic": false,
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
      authRedirectUrl: '/webview/index.html',
      maxConnections: 999,
      eventMiddlewares,
      dispatchMiddlewares,
    });

    expect(module.name).toBe('telegram');
    expect(module.mounterInterface).toMatchInlineSnapshot(`
      Object {
        "$$multi": false,
        "$$name": "TelegramPlatformMounterI",
        "$$polymorphic": false,
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
      authRedirectUrl: '/webview/index.html',
      maxConnections: 999,
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
      Telegram.ConfigsI,
      Telegram.Profiler,
      Http.RequestRouteList,
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
      Telegram.ConfigsI,
      Telegram.Profiler,
      Http.RequestRouteList,
    ]);

    expect(bot).toBeInstanceOf(TelegramBot);
    expect(profiler).toBeInstanceOf(TelegramProfiler);
    expect(configsProvided).toEqual(configs);

    expect(routings).toEqual([]);

    expect(() =>
      app.useServices([Telegram.Receiver])
    ).toThrowErrorMatchingInlineSnapshot(`"TelegramReceiver is not bound"`);
  });

  test('provide base interface', async () => {
    const app = Machinat.createApp({
      platforms: [Telegram.initModule({ botToken: '12345:_BOT_TOKEN_' })],
    });
    await app.start();

    const [bots, profilers, marshalTypes]: any = app.useServices([
      Base.Bot.PlatformMap,
      Base.Profiler.PlatformMap,
      Base.Marshaler.TypeI,
    ]);

    expect(bots.get('telegram')).toBeInstanceOf(TelegramBot);
    expect(profilers.get('telegram')).toBeInstanceOf(TelegramProfiler);
    expect(marshalTypes).toEqual(
      expect.arrayContaining([
        TelegramUser,
        TelegramChat,
        TelegramChatInstance,
        TelegramChatTarget,
        TelegramUserProfile,
        TelegramChatProfile,
      ])
    );
  });

  test('default entryPath to "/"', async () => {
    const configs = {
      botToken: '12345:_BOT_TOKEN_',
    };

    const app = Machinat.createApp({
      platforms: [Telegram.initModule(configs)],
    });
    await app.start();

    const [routings] = app.useServices([Http.RequestRouteList]);
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
