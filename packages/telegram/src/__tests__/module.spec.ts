import moxy from '@moxyjs/moxy';
import Sociably from '@sociably/core';
import { serviceProviderFactory } from '@sociably/core/service';
import BaseBot from '@sociably/core/base/Bot';
import BaseProfiler from '@sociably/core/base/Profiler';
import BaseMarshaler from '@sociably/core/base/Marshaler';
import { InMemoryState } from '@sociably/dev-tools';
import Http from '@sociably/http';
import Telegram from '../module.js';
import TelegramChat from '../Chat.js';
import TelegramChatSender from '../ChatSender.js';
import TelegramUser from '../User.js';
import { TelegramReceiver } from '../Receiver.js';
import TelegramChatProfile from '../ChatProfile.js';
import TelegramUserProfile from '../UserProfile.js';
import { TelegramProfiler } from '../Profiler.js';
import { TelegramBot } from '../Bot.js';
import { AgentSettingsAccessorI } from '../interface.js';
import { TelegramAssetsManager, saveUploadedFile } from '../asset/index.js';

it('export interfaces', () => {
  expect(Telegram.Receiver).toBe(TelegramReceiver);
  expect(Telegram.Bot).toBe(TelegramBot);
  expect(Telegram.Profiler).toBe(TelegramProfiler);
  expect(Telegram.Configs).toMatchInlineSnapshot(`
    {
      "$$multi": false,
      "$$name": "TelegramConfigs",
      "$$polymorphic": false,
      "$$typeof": Symbol(interface.service.sociably),
    }
  `);
});

describe('initModule(configs)', () => {
  it('create module object', () => {
    const eventMiddleware = (ctx, next) => next(ctx);
    const dispatchMiddleware = (ctx, next) => next(ctx);

    const module = Telegram.initModule({
      webhookPath: 'webhook/telegram',
      agentSettings: {
        botToken: '12345:_BOT_TOKEN_',
        botName: 'FooBot',
      },
      secretToken: '_SECRET_',
      maxRequestConnections: 999,
      eventMiddlewares: [eventMiddleware],
      dispatchMiddlewares: [dispatchMiddleware],
    });

    expect(module.name).toBe('telegram');
    expect(module.utilitiesInterface).toMatchInlineSnapshot(`
      {
        "$$multi": false,
        "$$name": "TelegramPlatformUtilities",
        "$$polymorphic": false,
        "$$typeof": Symbol(interface.service.sociably),
      }
    `);
    expect(module.provisions).toBeInstanceOf(Array);
    expect(typeof module.startHook).toBe('function');
    expect(module.eventMiddlewares).toEqual([eventMiddleware]);
    expect(module.dispatchMiddlewares).toEqual(
      expect.arrayContaining([dispatchMiddleware, saveUploadedFile]),
    );
  });

  test('provisions', async () => {
    const configs = {
      webhookPath: 'webhook/telegram',
      agentSettings: {
        botToken: '12345:_BOT_TOKEN_',
        botName: 'FooBot',
      },
      secretToken: '_SECRET_',
      maxRequestConnections: 999,
      eventMiddlewares: [(ctx, next) => next(ctx)],
    };

    const app = Sociably.createApp({
      modules: [
        Http.initModule({ entryUrl: 'https://sociably.io', noServer: true }),
        InMemoryState.initModule(),
      ],
      platforms: [Telegram.initModule(configs)],
    });
    await app.start();

    const [bot, receiver, configsProvided, profiler, assetsManager, routings] =
      app.useServices([
        Telegram.Bot,
        Telegram.Receiver,
        Telegram.Configs,
        Telegram.Profiler,
        Telegram.AssetsManager,
        Http.RequestRouteList,
      ]);

    expect(bot).toBeInstanceOf(TelegramBot);
    expect(receiver).toBeInstanceOf(TelegramReceiver);
    expect(profiler).toBeInstanceOf(TelegramProfiler);
    expect(assetsManager).toBeInstanceOf(TelegramAssetsManager);
    expect(configsProvided).toEqual(configs);
    expect(routings).toEqual([
      {
        name: 'telegram',
        path: 'webhook/telegram',
        handler: expect.any(Function),
      },
    ]);
  });

  test('provide base interface', async () => {
    const app = Sociably.createApp({
      modules: [
        Http.initModule({ entryUrl: 'https://sociably.io', noServer: true }),
        InMemoryState.initModule(),
      ],
      platforms: [
        Telegram.initModule({
          agentSettings: {
            botToken: '12345:_BOT_TOKEN_',
            botName: 'FooBot',
          },
          secretToken: '_SECRET_',
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
      ]),
    );
  });

  test('default webhookPath to "."', async () => {
    const configs = {
      agentSettings: {
        botToken: '12345:_BOT_TOKEN_',
        botName: 'FooBot',
      },
      secretToken: '_SECRET_',
    };

    const app = Sociably.createApp({
      modules: [
        Http.initModule({ entryUrl: 'https://sociably.io', noServer: true }),
        InMemoryState.initModule(),
      ],
      platforms: [Telegram.initModule(configs)],
    });
    await app.start();

    const [routings] = app.useServices([Http.RequestRouteList]);
    expect(routings).toEqual([
      { name: 'telegram', path: '.', handler: expect.any(Function) },
    ]);
  });

  test('with configs.agentSettings', async () => {
    const agentSettings = {
      botName: 'MyBot',
      botToken: '12345:_ACCESS_TOKEN_',
    };

    const app = Sociably.createApp({
      modules: [
        Http.initModule({ entryUrl: 'https://sociably.io', noServer: true }),
        InMemoryState.initModule(),
      ],
      platforms: [
        Telegram.initModule({ agentSettings, secretToken: '_SECRET_' }),
      ],
    });
    await app.start();
    const [agentSettingsAccessor] = app.useServices([AgentSettingsAccessorI]);

    await expect(
      agentSettingsAccessor.getAgentSettings(new TelegramUser(12345)),
    ).resolves.toEqual(agentSettings);
    await expect(
      agentSettingsAccessor.getAgentSettingsBatch([new TelegramUser(12345)]),
    ).resolves.toEqual([agentSettings]);

    await app.stop();
  });

  test('with configs.multiAgentSettings', async () => {
    const multiAgentSettings = [
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
      modules: [
        Http.initModule({ entryUrl: 'https://sociably.io', noServer: true }),
        InMemoryState.initModule(),
      ],
      platforms: [
        Telegram.initModule({ multiAgentSettings, secretToken: '_SECRET_' }),
      ],
    });
    await app.start();
    const [agentSettingsAccessor] = app.useServices([AgentSettingsAccessorI]);

    await expect(
      agentSettingsAccessor.getAgentSettings(new TelegramUser(1111111, true)),
    ).resolves.toEqual(multiAgentSettings[0]);
    await expect(
      agentSettingsAccessor.getAgentSettings(new TelegramUser(2222222, true)),
    ).resolves.toEqual(multiAgentSettings[1]);
    await expect(
      agentSettingsAccessor.getAgentSettingsBatch([
        new TelegramUser(1111111, true),
        new TelegramUser(1234567, true),
      ]),
    ).resolves.toEqual([multiAgentSettings[0], null]);

    await app.stop();
  });

  test('with configs.agentSettingsService', async () => {
    const agentSettings = {
      botName: 'MyBot',
      botToken: '12345:_ACCESS_TOKEN_',
      secretToken: '_SECRET_',
    };
    const settingsAccessor = {
      getAgentSettings: async () => agentSettings,
      getAgentSettingsBatch: async () => [agentSettings, agentSettings],
    };
    const myAgentSettingsService = serviceProviderFactory({})(
      () => settingsAccessor,
    );

    const app = Sociably.createApp({
      modules: [
        Http.initModule({ entryUrl: 'https://sociably.io', noServer: true }),
        InMemoryState.initModule(),
      ],
      platforms: [
        Telegram.initModule({
          agentSettingsService: myAgentSettingsService,
          secretToken: '_SECRET_',
        }),
      ],
      services: [myAgentSettingsService],
    });
    await app.start();
    const [agentSettingsAccessor] = app.useServices([AgentSettingsAccessorI]);

    expect(agentSettingsAccessor).toBe(settingsAccessor);
    await app.stop();
  });

  it('throw if no bot settings source provided', () => {
    expect(() =>
      Telegram.initModule({ secretToken: '_SECRET_' }),
    ).toThrowErrorMatchingInlineSnapshot(
      `"Telegram platform requires one of \`agentSettings\`, \`multiAgentSettings\` or \`agentSettingsService\` option"`,
    );
  });

  test('.startHook() start bot', async () => {
    const bot = moxy({ start: async () => {} });
    const module = Telegram.initModule({
      agentSettings: {
        botToken: '12345:_BOT_TOKEN_',
        botName: 'FooBot',
      },
      secretToken: '_SECRET_',
    });

    const { startHook } = module;
    await expect(startHook!.$$factory(bot)).resolves.toBe(undefined);
    expect(bot.start).toHaveBeenCalledTimes(1);
  });

  test('.stopHook() stop bot', async () => {
    const bot = moxy({ stop: async () => {} });
    const module = Telegram.initModule({
      agentSettings: {
        botToken: '12345:_BOT_TOKEN_',
        botName: 'FooBot',
      },
      secretToken: '_SECRET_',
    });

    const { stopHook } = module;
    await expect(stopHook!.$$factory(bot)).resolves.toBe(undefined);
    expect(bot.stop).toHaveBeenCalledTimes(1);
  });
});
