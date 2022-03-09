import moxy from '@moxyjs/moxy';
import Machinat from '@machinat/core';
import BaseBot from '@machinat/core/base/Bot';
import BaseProfiler from '@machinat/core/base/Profiler';
import BaseMarshaler from '@machinat/core/base/Marshaler';
import Http from '@machinat/http';
import Telegram from '../module';
import TelegramChat from '../Chat';
import TelegramChatTarget from '../ChatTarget';
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
      webhookPath: '/webhook/telegram',
      secretPath: '_SECRET_',
      maxConnections: 999,
      eventMiddlewares,
      dispatchMiddlewares,
    });

    expect(module.name).toBe('telegram');
    expect(module.utilitiesInterface).toMatchInlineSnapshot(`
      Object {
        "$$multi": false,
        "$$name": "TelegramPlatformUtilities",
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
      webhookPath: '/webhook/telegram',
      secretPath: '_SECRET_',
      authRedirectUrl: '/webview/index.html',
      maxConnections: 999,
      eventMiddlewares: [(ctx, next) => next(ctx)],
    };

    const app = Machinat.createApp({
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
    const app = Machinat.createApp({
      platforms: [Telegram.initModule({ botToken: '12345:_BOT_TOKEN_' })],
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
        TelegramChatTarget,
        TelegramUserProfile,
        TelegramChatProfile,
      ])
    );
  });

  test('default webhookPath to "/"', async () => {
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

  test('.startHook() start bot', async () => {
    const bot = moxy({ start: async () => {} });
    const module = Telegram.initModule({
      botToken: '12345:_BOT_TOKEN_',
    });

    const startHook = module.startHook as any;
    await expect(startHook(bot)).resolves.toBe(undefined);
    expect(bot.start.mock).toHaveBeenCalledTimes(1);
  });

  test('.stopHook() stop bot', async () => {
    const bot = moxy({ stop: async () => {} });
    const module = Telegram.initModule({
      botToken: '12345:_BOT_TOKEN_',
    });

    const stopHook = module.stopHook as any;
    await expect(stopHook(bot)).resolves.toBe(undefined);
    expect(bot.stop.mock).toHaveBeenCalledTimes(1);
  });
});
