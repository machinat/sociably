import moxy from '@moxyjs/moxy';
import Sociably from '@sociably/core';
import BaseBot from '@sociably/core/base/Bot';
import BaseProfiler from '@sociably/core/base/Profiler';
import BaseMarshaler from '@sociably/core/base/Marshaler';
import Http from '@sociably/http';
import Telegram from '../module';
import TelegramChat from '../Chat';
import TelegramChatSender from '../ChatSender';
import TelegramUser from '../User';
import { TelegramReceiver } from '../Receiver';
import TelegramChatProfile from '../ChatProfile';
import TelegramUserProfile from '../UserProfile';
import { TelegramProfiler } from '../Profiler';
import { TelegramBot } from '../Bot';

it('export interfaces', () => {
  expect(Telegram.Receiver).toBe(TelegramReceiver);
  expect(Telegram.Bot).toBe(TelegramBot);
  expect(Telegram.Profiler).toBe(TelegramProfiler);
  expect(Telegram.Configs).toMatchInlineSnapshot(`
    Object {
      "$$multi": false,
      "$$name": "TelegramConfigs",
      "$$polymorphic": false,
      "$$typeof": Symbol(interface.service.sociably),
    }
  `);
});

describe('initModule(configs)', () => {
  it('create module object', () => {
    const eventMiddlewares = [(ctx, next) => next(ctx)];
    const dispatchMiddlewares = [(ctx, next) => next(ctx)];

    const module = Telegram.initModule({
      botToken: '12345:_BOT_TOKEN_',
      botName: 'FooBot',
      webhookPath: '/webhook/telegram',
      secretPath: '_SECRET_',
      maxRequestConnections: 999,
      eventMiddlewares,
      dispatchMiddlewares,
    });

    expect(module.name).toBe('telegram');
    expect(module.utilitiesInterface).toMatchInlineSnapshot(`
      Object {
        "$$multi": false,
        "$$name": "TelegramPlatformUtilities",
        "$$polymorphic": false,
        "$$typeof": Symbol(interface.service.sociably),
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
      botName: 'FooBot',
      webhookPath: '/webhook/telegram',
      secretPath: '_SECRET_',
      authRedirectUrl: '/webview/index.html',
      maxRequestConnections: 999,
      eventMiddlewares: [(ctx, next) => next(ctx)],
    };

    const app = Sociably.createApp({
      platforms: [Telegram.initModule(configs)],
    });
    await app.start();

    const [bot, receiver, configsProvided, profiler, routings] =
      app.useServices([
        Telegram.Bot,
        Telegram.Receiver,
        Telegram.Configs,
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

  test('provide base interface', async () => {
    const app = Sociably.createApp({
      platforms: [
        Telegram.initModule({
          botToken: '12345:_BOT_TOKEN_',
          botName: 'FooBot',
        }),
      ],
    });
    await app.start();

    const [bots, profilers, marshalTypes]: any = app.useServices([
      BaseBot.PlatformMap,
      BaseProfiler.PlatformMap,
      BaseMarshaler.TypeList,
    ]);

    expect(bots.get('telegram')).toBeInstanceOf(TelegramBot);
    expect(profilers.get('telegram')).toBeInstanceOf(TelegramProfiler);
    expect(marshalTypes).toEqual(
      expect.arrayContaining([
        TelegramUser,
        TelegramChat,
        TelegramChatSender,
        TelegramUserProfile,
        TelegramChatProfile,
      ])
    );
  });

  test('default webhookPath to "/"', async () => {
    const configs = {
      botToken: '12345:_BOT_TOKEN_',
      botName: 'FooBot',
    };

    const app = Sociably.createApp({
      platforms: [Telegram.initModule(configs)],
    });
    await app.start();

    const [routings] = app.useServices([Http.RequestRouteList]);
    expect(routings).toEqual([
      { name: 'telegram', path: '/', handler: expect.any(Function) },
    ]);
  });

  test('.startHook() start bot', async () => {
    const bot = moxy({ start: async () => {} });
    const module = Telegram.initModule({
      botToken: '12345:_BOT_TOKEN_',
      botName: 'FooBot',
    });

    const startHook = module.startHook as any;
    await expect(startHook(bot)).resolves.toBe(undefined);
    expect(bot.start).toHaveBeenCalledTimes(1);
  });

  test('.stopHook() stop bot', async () => {
    const bot = moxy({ stop: async () => {} });
    const module = Telegram.initModule({
      botToken: '12345:_BOT_TOKEN_',
      botName: 'FooBot',
    });

    const stopHook = module.stopHook as any;
    await expect(stopHook(bot)).resolves.toBe(undefined);
    expect(bot.stop).toHaveBeenCalledTimes(1);
  });
});
