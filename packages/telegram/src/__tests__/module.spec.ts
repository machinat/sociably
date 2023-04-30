import moxy from '@moxyjs/moxy';
import Sociably from '@sociably/core';
import { makeFactoryProvider } from '@sociably/core/service';
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
import { BotSettingsAccessorI } from '../interface';

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
      botSettings: {
        botToken: '12345:_BOT_TOKEN_',
        botName: 'FooBot',
        secretToken: '_SECRET_',
      },
      webhookPath: '/webhook/telegram',
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
      botSettings: {
        botToken: '12345:_BOT_TOKEN_',
        botName: 'FooBot',
        secretToken: '_SECRET_',
      },
      webhookPath: '/webhook/telegram',
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
          botSettings: {
            botToken: '12345:_BOT_TOKEN_',
            botName: 'FooBot',
            secretToken: '_SECRET_',
          },
        }),
      ],
    });
    await app.start();

    const [bots, profilers, marshalTypes] = app.useServices([
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
      botSettings: {
        botToken: '12345:_BOT_TOKEN_',
        botName: 'FooBot',
        secretToken: '_SECRET_',
      },
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

  test('with configs.botSettings', async () => {
    const botSettings = {
      botName: 'MyBot',
      botToken: '12345:_ACCESS_TOKEN_',
      secretToken: '_SECRET_',
    };

    const app = Sociably.createApp({
      platforms: [Telegram.initModule({ botSettings })],
    });
    await app.start();
    const [botSettingsAccessor] = app.useServices([BotSettingsAccessorI]);

    await expect(
      botSettingsAccessor.getChannelSettings(new TelegramUser(12345))
    ).resolves.toEqual(botSettings);
    await expect(
      botSettingsAccessor.getChannelSettingsBatch([new TelegramUser(12345)])
    ).resolves.toEqual([botSettings]);
    await expect(
      botSettingsAccessor.listAllChannelSettings('telegram')
    ).resolves.toEqual([botSettings]);

    await app.stop();
  });

  test('with configs.multiBotSettings', async () => {
    const multiBotSettings = [
      {
        botName: 'MyBot',
        botToken: '1111111:_ACCESS_TOKEN_',
        secretToken: '_SECRET_',
      },
      {
        botName: 'MyBox',
        botToken: '2222222:_ACCESS_TOKEN_',
        secretToken: '_SECRET_',
      },
    ];

    const app = Sociably.createApp({
      platforms: [Telegram.initModule({ multiBotSettings })],
    });
    await app.start();
    const [botSettingsAccessor] = app.useServices([BotSettingsAccessorI]);

    await expect(
      botSettingsAccessor.getChannelSettings(new TelegramUser(1111111, true))
    ).resolves.toEqual(multiBotSettings[0]);
    await expect(
      botSettingsAccessor.getChannelSettings(new TelegramUser(2222222, true))
    ).resolves.toEqual(multiBotSettings[1]);
    await expect(
      botSettingsAccessor.getChannelSettingsBatch([
        new TelegramUser(1111111, true),
        new TelegramUser(1234567, true),
      ])
    ).resolves.toEqual([multiBotSettings[0], null]);

    await expect(
      botSettingsAccessor.listAllChannelSettings('telegram')
    ).resolves.toEqual(multiBotSettings);

    await app.stop();
  });

  test('with configs.botSettingsService', async () => {
    const botSettings = {
      botName: 'MyBot',
      botToken: '12345:_ACCESS_TOKEN_',
      secretToken: '_SECRET_',
    };
    const settingsAccessor = {
      getChannelSettings: async () => botSettings,
      getChannelSettingsBatch: async () => [botSettings, botSettings],
      listAllChannelSettings: async () => [botSettings, botSettings],
    };
    const myBotSettingsService = makeFactoryProvider({})(
      () => settingsAccessor
    );

    const app = Sociably.createApp({
      platforms: [
        Telegram.initModule({
          botSettingsService: myBotSettingsService,
        }),
      ],
      services: [myBotSettingsService],
    });
    await app.start();
    const [botSettingsAccessor] = app.useServices([BotSettingsAccessorI]);

    expect(botSettingsAccessor).toBe(settingsAccessor);
    await app.stop();
  });

  it('throw if no bot settings source provided', () => {
    expect(() => Telegram.initModule({})).toThrowErrorMatchingInlineSnapshot(
      `"Telegram platform requires one of \`botSettings\`, \`multiBotSettings\` or \`botSettingsService\` option"`
    );
  });

  test('.startHook() start bot', async () => {
    const bot = moxy({ start: async () => {} });
    const module = Telegram.initModule({
      botSettings: {
        botToken: '12345:_BOT_TOKEN_',
        botName: 'FooBot',
        secretToken: '_SECRET_',
      },
    });

    const { startHook } = module;
    await expect(startHook!.$$factory(bot)).resolves.toBe(undefined);
    expect(bot.start).toHaveBeenCalledTimes(1);
  });

  test('.stopHook() stop bot', async () => {
    const bot = moxy({ stop: async () => {} });
    const module = Telegram.initModule({
      botSettings: {
        botToken: '12345:_BOT_TOKEN_',
        botName: 'FooBot',
        secretToken: '_SECRET_',
      },
    });

    const { stopHook } = module;
    await expect(stopHook!.$$factory(bot)).resolves.toBe(undefined);
    expect(bot.stop).toHaveBeenCalledTimes(1);
  });
});
