import { moxy } from '@moxyjs/moxy';
import Sociably from '@sociably/core';
import { serviceProviderFactory } from '@sociably/core/service';
import BaseBot from '@sociably/core/base/Bot';
import BaseProfiler from '@sociably/core/base/Profiler';
import BaseMarshaler from '@sociably/core/base/Marshaler';
import Http from '@sociably/http';
import { InMemoryState } from '@sociably/dev-tools';
import Instagram from '../module.js';
import { AgentSettingsAccessorI } from '../interface.js';
import {
  InstagramAssetsManager,
  saveReusableAttachments,
} from '../asset/index.js';
import InstagramAgent from '../Agent.js';
import InstagramChat from '../Chat.js';
import InstagramUser from '../User.js';
import InstagramUserProfile from '../UserProfile.js';
import { InstagramProfiler } from '../Profiler.js';
import { InstagramReceiver } from '../Receiver.js';
import { InstagramBot } from '../Bot.js';

it('export interfaces', () => {
  expect(Instagram.Receiver).toBe(InstagramReceiver);
  expect(Instagram.Bot).toBe(InstagramBot);
  expect(Instagram.Profiler).toBe(InstagramProfiler);
  expect(Instagram.Configs).toMatchInlineSnapshot(`
    {
      "$$multi": false,
      "$$name": "InstagramConfigs",
      "$$polymorphic": false,
      "$$typeof": Symbol(interface.service.sociably),
    }
  `);
});

const agentSettings = {
  accountId: '1234567890',
  pageId: '9876543210',
  accessToken: '_ACCESS_TOKEN_',
  username: 'janedoe777',
};

describe('initModule(configs)', () => {
  it('create module object', () => {
    const eventMiddleware = (ctx, next) => next(ctx);
    const dispatchMiddleware = (ctx, next) => next(ctx);

    const module = Instagram.initModule({
      agentSettings,
      appId: '_APP_ID_',
      appSecret: '_APP_SECRET_',
      webhookVerifyToken: '_VERIFY_TOKEN_',
      eventMiddlewares: [eventMiddleware],
      dispatchMiddlewares: [dispatchMiddleware],
    });

    expect(module.name).toBe('instagram');
    expect(module.utilitiesInterface).toMatchInlineSnapshot(`
      {
        "$$multi": false,
        "$$name": "InstagramPlatformUtilities",
        "$$polymorphic": false,
        "$$typeof": Symbol(interface.service.sociably),
      }
    `);
    expect(module.provisions).toBeInstanceOf(Array);
    expect(typeof module.startHook).toBe('function');
    expect(module.eventMiddlewares).toEqual([eventMiddleware]);
    expect(module.dispatchMiddlewares).toEqual(
      expect.arrayContaining([dispatchMiddleware, saveReusableAttachments])
    );
  });

  test('provisions', async () => {
    const configs = {
      agentSettings,
      appId: '_APP_ID_',
      appSecret: '_APP_SECRET_',
      webhookVerifyToken: '_VERIFY_TOKEN_',
      webhookPath: 'webhook/instagram',
      eventMiddlewares: [(ctx, next) => next(ctx)],
    };

    const app = Sociably.createApp({
      modules: [
        Http.initModule({ entryUrl: 'https://sociably.io', noServer: true }),
        InMemoryState.initModule(),
      ],
      platforms: [Instagram.initModule(configs)],
    });
    await app.start();

    const [
      bot,
      receiver,
      profiler,
      configsProvided,
      assetManager,
      routings,
      agentSettingsAccessor,
    ] = app.useServices([
      Instagram.Bot,
      Instagram.Receiver,
      Instagram.Profiler,
      Instagram.Configs,
      Instagram.AssetsManager,
      Http.RequestRouteList,
      AgentSettingsAccessorI,
    ]);

    expect(bot).toBeInstanceOf(InstagramBot);
    expect(receiver).toBeInstanceOf(InstagramReceiver);
    expect(profiler).toBeInstanceOf(InstagramProfiler);
    expect(assetManager).toBeInstanceOf(InstagramAssetsManager);
    expect(configsProvided).toEqual(configs);
    expect(routings).toEqual([
      {
        name: 'instagram',
        path: 'webhook/instagram',
        handler: expect.any(Function),
      },
    ]);
    expect(agentSettingsAccessor).toEqual({
      getAgentSettings: expect.any(Function),
      getAgentSettingsBatch: expect.any(Function),
    });

    bot.stop();
  });

  test('provide base interfaces', async () => {
    const app = Sociably.createApp({
      modules: [
        Http.initModule({ entryUrl: 'https://sociably.io', noServer: true }),
        InMemoryState.initModule(),
      ],
      platforms: [
        Instagram.initModule({
          agentSettings,
          appId: '_APP_ID_',
          appSecret: '_APP_SECRET_',
          webhookVerifyToken: '_VERIFY_TOKEN_',
        }),
      ],
    });
    await app.start();

    const [bot, bots, profilers, marshalTypes] = app.useServices([
      Instagram.Bot,
      BaseBot.PlatformMap,
      BaseProfiler.PlatformMap,
      BaseMarshaler.TypeList,
    ]);

    expect(bot).toBeInstanceOf(InstagramBot);
    expect(bots.get('instagram')).toBe(bot);
    expect(profilers.get('instagram')).toBeInstanceOf(InstagramProfiler);
    expect(marshalTypes).toEqual(
      expect.arrayContaining([
        InstagramAgent,
        InstagramChat,
        InstagramUser,
        InstagramUserProfile,
      ])
    );

    bot.stop();
  });

  test('default webhookPath to "."', async () => {
    const app = Sociably.createApp({
      modules: [
        Http.initModule({ entryUrl: 'https://sociably.io', noServer: true }),
        InMemoryState.initModule(),
      ],
      platforms: [
        Instagram.initModule({
          agentSettings,
          appId: '...',
          appSecret: '...',
          webhookVerifyToken: '...',
          shouldHandleChallenge: false,
          shouldVerifyRequest: false,
        }),
      ],
    });
    await app.start();

    const [routings] = app.useServices([Http.RequestRouteList]);
    expect(routings).toEqual([
      {
        name: 'instagram',
        path: '.',
        handler: expect.any(Function),
      },
    ]);

    app.useServices([Instagram.Bot])[0].stop();
  });

  test('with configs.agentSettings', async () => {
    const app = Sociably.createApp({
      modules: [
        Http.initModule({ entryUrl: 'https://sociably.io', noServer: true }),
        InMemoryState.initModule(),
      ],
      platforms: [
        Instagram.initModule({
          agentSettings,
          appId: '_APP_ID_',
          appSecret: '_APP_SECRET_',
          webhookVerifyToken: '_VERIFY_TOKEN_',
        }),
      ],
    });
    await app.start();
    const [agentSettingsAccessor] = app.useServices([AgentSettingsAccessorI]);

    await expect(
      agentSettingsAccessor.getAgentSettings(new InstagramAgent('1234567890'))
    ).resolves.toEqual(agentSettings);
    await expect(
      agentSettingsAccessor.getAgentSettings(new InstagramAgent('9876543210'))
    ).resolves.toEqual(null);

    await expect(
      agentSettingsAccessor.getAgentSettingsBatch([
        new InstagramAgent('1234567890'),
        new InstagramAgent('9876543210'),
      ])
    ).resolves.toEqual([agentSettings, null]);

    await app.stop();
  });

  test('with configs.multiAgentSettings', async () => {
    const multiAgentSettings = [
      {
        accountId: '1234567890',
        pageId: '5555555555',
        accessToken: '_ACCESS_TOKEN_1_',
        username: 'johndoe321',
      },
      {
        accountId: '9876543210',
        pageId: '6666666666',
        accessToken: '_ACCESS_TOKEN_2_',
        username: 'janedoe777',
      },
    ];
    const app = Sociably.createApp({
      modules: [
        Http.initModule({ entryUrl: 'https://sociably.io', noServer: true }),
        InMemoryState.initModule(),
      ],
      platforms: [
        Instagram.initModule({
          multiAgentSettings,
          appId: '_APP_ID_',
          appSecret: '_APP_SECRET_',
          webhookVerifyToken: '_VERIFY_TOKEN_',
        }),
      ],
    });
    await app.start();
    const [agentSettingsAccessor] = app.useServices([AgentSettingsAccessorI]);

    await expect(
      agentSettingsAccessor.getAgentSettings(new InstagramAgent('1234567890'))
    ).resolves.toEqual(multiAgentSettings[0]);
    await expect(
      agentSettingsAccessor.getAgentSettings(new InstagramAgent('9876543210'))
    ).resolves.toEqual(multiAgentSettings[1]);
    await expect(
      agentSettingsAccessor.getAgentSettings(new InstagramAgent('8888888888'))
    ).resolves.toBe(null);

    await expect(
      agentSettingsAccessor.getAgentSettingsBatch([
        new InstagramAgent('9876543210'),
        new InstagramAgent('1234567890'),
        new InstagramAgent('8888888888'),
      ])
    ).resolves.toEqual([multiAgentSettings[1], multiAgentSettings[0], null]);

    await app.stop();
  });

  test('with configs.agentSettingsService', async () => {
    const settingsAccessor = {
      getAgentSettings: async () => agentSettings,
      getAgentSettingsBatch: async () => [agentSettings, agentSettings],
    };
    const mySettingsService = serviceProviderFactory({})(
      () => settingsAccessor
    );

    const app = Sociably.createApp({
      modules: [
        Http.initModule({ entryUrl: 'https://sociably.io', noServer: true }),
        InMemoryState.initModule(),
      ],
      platforms: [
        Instagram.initModule({
          agentSettingsService: mySettingsService,
          appId: '_APP_ID_',
          appSecret: '_APP_SECRET_',
          webhookVerifyToken: '_VERIFY_TOKEN_',
        }),
      ],
      services: [mySettingsService],
    });
    await app.start();
    const [agentSettingsAccessor] = app.useServices([AgentSettingsAccessorI]);

    expect(agentSettingsAccessor).toBe(settingsAccessor);
    await app.stop();
  });

  it('throw if no page settings source provided', () => {
    expect(() =>
      Instagram.initModule({
        appId: '...',
        appSecret: '...',
        webhookVerifyToken: '...',
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"Instagram platform requires one of \`agentSettings\`, \`multiAgentSettings\` or \`agentSettingsService\` option"`
    );
  });

  test('#startHook() start bot', async () => {
    const bot = moxy({ start: async () => {} });
    const module = Instagram.initModule({
      agentSettings,
      appId: '...',
      appSecret: '...',
      webhookVerifyToken: '...',
    });

    await expect(module.startHook!.$$factory(bot)).resolves.toBe(undefined);
    expect(bot.start).toHaveBeenCalledTimes(1);
  });

  test('#stopHook() stop bot', async () => {
    const bot = moxy<InstagramBot>({ stop: async () => {} } as never);
    const module = Instagram.initModule({
      agentSettings,
      appId: '...',
      appSecret: '...',
      webhookVerifyToken: '...',
    });

    await expect(module.stopHook!.$$factory(bot)).resolves.toBe(undefined);
    expect(bot.stop).toHaveBeenCalledTimes(1);
  });
});
