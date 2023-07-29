import { moxy } from '@moxyjs/moxy';
import Sociably from '@sociably/core';
import { serviceProviderFactory } from '@sociably/core/service';
import BaseBot from '@sociably/core/base/Bot';
import BaseProfiler from '@sociably/core/base/Profiler';
import BaseMarshaler from '@sociably/core/base/Marshaler';
import Http from '@sociably/http';
import { InMemoryState } from '@sociably/dev-tools';
import WhatsApp from '../module.js';
import { AgentSettingsAccessorI } from '../interface.js';
import { WhatsAppAssetsManager, saveUploadedMedia } from '../asset/index.js';
import WhatsAppAgent from '../Agent.js';
import WhatsAppChat from '../Chat.js';
import WhatsAppUser from '../User.js';
import WhatsAppUserProfile from '../UserProfile.js';
import { WhatsAppProfiler } from '../Profiler.js';
import { WhatsAppReceiver } from '../Receiver.js';
import { WhatsAppBot } from '../Bot.js';

const agentSettings = {
  phoneNumber: '+1234567890',
  numberId: '1111111111',
};

it('export interfaces', () => {
  expect(WhatsApp.Receiver).toBe(WhatsAppReceiver);
  expect(WhatsApp.Bot).toBe(WhatsAppBot);
  expect(WhatsApp.Profiler).toBe(WhatsAppProfiler);
  expect(WhatsApp.Configs).toMatchInlineSnapshot(`
    {
      "$$multi": false,
      "$$name": "WhatsAppConfigs",
      "$$polymorphic": false,
      "$$typeof": Symbol(interface.service.sociably),
    }
  `);
});

describe('initModule(configs)', () => {
  it('create module object', () => {
    const eventMiddleware = (ctx, next) => next(ctx);
    const dispatchMiddleware = (ctx, next) => next(ctx);

    const module = WhatsApp.initModule({
      agentSettings,
      accessToken: '_ACCESS_TOKEN_',
      appId: '_APP_ID_',
      appSecret: '_APP_SECRET_',
      verifyToken: '_VERIFY_TOKEN_',
      eventMiddlewares: [eventMiddleware],
      dispatchMiddlewares: [dispatchMiddleware],
    });

    expect(module.name).toBe('whatsapp');
    expect(module.utilitiesInterface).toMatchInlineSnapshot(`
      {
        "$$multi": false,
        "$$name": "WhatsAppPlatformUtilities",
        "$$polymorphic": false,
        "$$typeof": Symbol(interface.service.sociably),
      }
    `);
    expect(module.provisions).toBeInstanceOf(Array);
    expect(typeof module.startHook).toBe('function');
    expect(module.eventMiddlewares).toEqual([eventMiddleware]);
    expect(module.dispatchMiddlewares).toEqual(
      expect.arrayContaining([dispatchMiddleware, saveUploadedMedia])
    );
  });

  test('provisions', async () => {
    const configs = {
      agentSettings,
      accessToken: '_ACCESS_TOKEN_',
      appId: '_APP_ID_',
      appSecret: '_APP_SECRET_',
      verifyToken: '_VERIFY_TOKEN_',
      webhookPath: '/webhook/whatsapp',
      eventMiddlewares: [(ctx, next) => next(ctx)],
    };

    const app = Sociably.createApp({
      modules: [InMemoryState.initModule()],
      platforms: [WhatsApp.initModule(configs)],
    });
    await app.start();

    const [bot, receiver, profiler, assetsManager, configsProvided, routings] =
      app.useServices([
        WhatsApp.Bot,
        WhatsApp.Receiver,
        WhatsApp.Profiler,
        WhatsApp.AssetsManager,
        WhatsApp.Configs,
        Http.RequestRouteList,
      ]);

    expect(bot).toBeInstanceOf(WhatsAppBot);
    expect(receiver).toBeInstanceOf(WhatsAppReceiver);
    expect(profiler).toBeInstanceOf(WhatsAppProfiler);
    expect(assetsManager).toBeInstanceOf(WhatsAppAssetsManager);
    expect(configsProvided).toEqual(configs);
    expect(routings).toEqual([
      {
        name: 'whatsapp',
        path: '/webhook/whatsapp',
        handler: expect.any(Function),
      },
    ]);

    bot.stop();
  });

  test('provide base interfaces', async () => {
    const app = Sociably.createApp({
      modules: [InMemoryState.initModule()],
      platforms: [
        WhatsApp.initModule({
          agentSettings,
          accessToken: '_ACCESS_TOKEN_',
          appId: '_APP_ID_',
          appSecret: '_APP_SECRET_',
          verifyToken: '_VERIFY_TOKEN_',
        }),
      ],
    });
    await app.start();

    const [bot, bots, profilers, marshalTypes] = app.useServices([
      WhatsApp.Bot,
      BaseBot.PlatformMap,
      BaseProfiler.PlatformMap,
      BaseMarshaler.TypeList,
    ]);

    expect(bot).toBeInstanceOf(WhatsAppBot);
    expect(bots.get('whatsapp')).toBe(bot);
    expect(profilers.get('whatsapp')).toBeInstanceOf(WhatsAppProfiler);
    expect(marshalTypes).toEqual(
      expect.arrayContaining([
        WhatsAppAgent,
        WhatsAppChat,
        WhatsAppUser,
        WhatsAppUserProfile,
      ])
    );

    bot.stop();
  });

  test('with configs.agentSettings', async () => {
    const app = Sociably.createApp({
      modules: [InMemoryState.initModule()],
      platforms: [
        WhatsApp.initModule({
          agentSettings,
          accessToken: '_ACCESS_TOKEN_',
          appId: '_APP_ID_',
          appSecret: '_APP_SECRET_',
          verifyToken: '_VERIFY_TOKEN_',
        }),
      ],
    });
    await app.start();
    const [agentSettingsAccessor] = app.useServices([AgentSettingsAccessorI]);

    const agent = new WhatsAppAgent('1111111111');
    const unknownAgent = new WhatsAppAgent('2222222222');

    await expect(
      agentSettingsAccessor.getAgentSettings(agent)
    ).resolves.toEqual(agentSettings);
    await expect(
      agentSettingsAccessor.getAgentSettings(unknownAgent)
    ).resolves.toBe(null);

    await expect(
      agentSettingsAccessor.getAgentSettingsBatch([agent, unknownAgent])
    ).resolves.toEqual([agentSettings, null]);

    await app.stop();
  });

  test('with configs.multiPageSettings', async () => {
    const businessAccountSettings = [
      {
        accountId: '9999999999',
        numbers: [
          { numberId: '1111111111', phoneNumber: '+1234567890' },
          { numberId: '2222222222', phoneNumber: '+9876543210' },
        ],
      },
      {
        accountId: '8888888888',
        numbers: [{ numberId: '3333333333', phoneNumber: '+1111111111' }],
      },
    ];
    const app = Sociably.createApp({
      modules: [InMemoryState.initModule()],
      platforms: [
        WhatsApp.initModule({
          multiAgentSettings: businessAccountSettings,
          accessToken: '_ACCESS_TOKEN_',
          appId: '_APP_ID_',
          appSecret: '_APP_SECRET_',
          verifyToken: '_VERIFY_TOKEN_',
        }),
      ],
    });
    await app.start();
    const [agentSettingsAccessor] = app.useServices([AgentSettingsAccessorI]);

    const agent1 = new WhatsAppAgent('1111111111');
    const agentSettings1 = {
      numberId: '1111111111',
      phoneNumber: '+1234567890',
    };
    const agent2 = new WhatsAppAgent('2222222222');
    const agentSettings2 = {
      numberId: '2222222222',
      phoneNumber: '+9876543210',
    };
    const agent3 = new WhatsAppAgent('3333333333');
    const agentSettings3 = {
      numberId: '3333333333',
      phoneNumber: '+1111111111',
    };
    const unknownAgent = new WhatsAppAgent('4444444444');

    await expect(
      agentSettingsAccessor.getAgentSettings(agent1)
    ).resolves.toEqual(agentSettings1);
    await expect(
      agentSettingsAccessor.getAgentSettings(agent2)
    ).resolves.toEqual(agentSettings2);
    await expect(
      agentSettingsAccessor.getAgentSettings(agent3)
    ).resolves.toEqual(agentSettings3);
    await expect(
      agentSettingsAccessor.getAgentSettings(unknownAgent)
    ).resolves.toBe(null);

    await expect(
      agentSettingsAccessor.getAgentSettingsBatch([
        agent2,
        agent3,
        unknownAgent,
      ])
    ).resolves.toEqual([agentSettings2, agentSettings3, null]);

    await app.stop();
  });

  test('with configs.agentSettingsService', async () => {
    const settingsAccessor = {
      getAgentSettings: async () => agentSettings,
      getAgentSettingsBatch: async () => [agentSettings, agentSettings],
    };
    const myAgentSettingsService = serviceProviderFactory({})(
      () => settingsAccessor
    );

    const app = Sociably.createApp({
      modules: [InMemoryState.initModule()],
      platforms: [
        WhatsApp.initModule({
          agentSettingsService: myAgentSettingsService,
          accessToken: '_ACCESS_TOKEN_',
          appId: '_APP_ID_',
          appSecret: '_APP_SECRET_',
          verifyToken: '_VERIFY_TOKEN_',
        }),
      ],
      services: [myAgentSettingsService],
    });
    await app.start();
    const [agentSettingsAccessor] = app.useServices([AgentSettingsAccessorI]);

    expect(agentSettingsAccessor).toBe(settingsAccessor);
    await app.stop();
  });

  test('default webhookPath to "."', async () => {
    const app = Sociably.createApp({
      modules: [InMemoryState.initModule()],
      platforms: [
        WhatsApp.initModule({
          agentSettings,
          accessToken: '_ACCESS_TOKEN_',
          shouldHandleChallenge: false,
          verifyToken: '',
          shouldVerifyRequest: false,
          appId: '',
          appSecret: '',
        }),
      ],
    });
    await app.start();

    const [routings] = app.useServices([Http.RequestRouteList]);
    expect(routings).toEqual([
      { name: 'whatsapp', path: '.', handler: expect.any(Function) },
    ]);

    app.useServices([WhatsApp.Bot])[0].stop();
  });

  test('#startHook() start bot', async () => {
    const bot = moxy({ start: async () => {} });
    const module = WhatsApp.initModule({
      agentSettings,
      accessToken: '_ACCESS_TOKEN_',
      appId: '_APP_ID_',
      appSecret: '_APP_SECRET_',
      verifyToken: '_VERIFY_TOKEN_',
    });

    await expect(module.startHook!.$$factory(bot)).resolves.toBe(undefined);
    expect(bot.start).toHaveBeenCalledTimes(1);
  });

  test('#stopHook() stop bot', async () => {
    const bot = moxy({ stop: async () => {} });
    const module = WhatsApp.initModule({
      agentSettings,
      accessToken: '_ACCESS_TOKEN_',
      appId: '_APP_ID_',
      appSecret: '_APP_SECRET_',
      verifyToken: '_VERIFY_TOKEN_',
    });

    await expect(module.stopHook!.$$factory(bot)).resolves.toBe(undefined);
    expect(bot.stop).toHaveBeenCalledTimes(1);
  });
});
