import moxy from '@moxyjs/moxy';
import Sociably from '@sociably/core';
import {
  serviceInterface,
  serviceProviderFactory,
} from '@sociably/core/service';
import BaseSender from '@sociably/core/base/Sender.js';
import BaseProfiler from '@sociably/core/base/Profiler.js';
import BaseMarshaler from '@sociably/core/base/Marshaler.js';
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
import { WhatsAppSender } from '../Sender.js';

const agentSettings = {
  phoneNumber: '+1234567890',
  numberId: '1111111111',
  businessAccountId: '9999999999',
};

it('export interfaces', () => {
  expect(WhatsApp.Receiver).toBe(WhatsAppReceiver);
  expect(WhatsApp.Sender).toBe(WhatsAppSender);
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
      webhookVerifyToken: '_VERIFY_TOKEN_',
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
      expect.arrayContaining([dispatchMiddleware, saveUploadedMedia]),
    );
  });

  test('provisions', async () => {
    const configs = {
      agentSettings,
      accessToken: '_ACCESS_TOKEN_',
      appId: '_APP_ID_',
      appSecret: '_APP_SECRET_',
      webhookVerifyToken: '_VERIFY_TOKEN_',
      webhookPath: 'webhook/whatsapp',
      eventMiddlewares: [(ctx, next) => next(ctx)],
    };

    const app = Sociably.createApp({
      modules: [
        Http.initModule({ noServer: true, entryUrl: 'http://sociably.io' }),
        InMemoryState.initModule(),
      ],
      platforms: [WhatsApp.initModule(configs)],
    });
    await app.start();

    const [
      sender,
      receiver,
      profiler,
      assetsManager,
      configsProvided,
      routings,
    ] = app.useServices([
      WhatsApp.Sender,
      WhatsApp.Receiver,
      WhatsApp.Profiler,
      WhatsApp.AssetsManager,
      WhatsApp.Configs,
      Http.RequestRouteList,
    ]);

    expect(sender).toBeInstanceOf(WhatsAppSender);
    expect(receiver).toBeInstanceOf(WhatsAppReceiver);
    expect(profiler).toBeInstanceOf(WhatsAppProfiler);
    expect(assetsManager).toBeInstanceOf(WhatsAppAssetsManager);
    expect(configsProvided).toEqual(configs);
    expect(routings).toEqual([
      {
        name: 'whatsapp',
        path: 'webhook/whatsapp',
        handler: expect.any(Function),
      },
    ]);

    sender.stop();
  });

  test('provide base interfaces', async () => {
    const app = Sociably.createApp({
      modules: [
        Http.initModule({ noServer: true, entryUrl: 'http://sociably.io' }),
        InMemoryState.initModule(),
      ],
      platforms: [
        WhatsApp.initModule({
          agentSettings,
          accessToken: '_ACCESS_TOKEN_',
          appId: '_APP_ID_',
          appSecret: '_APP_SECRET_',
          webhookVerifyToken: '_VERIFY_TOKEN_',
        }),
      ],
    });
    await app.start();

    const [sender, bots, profilers, marshalTypes] = app.useServices([
      WhatsApp.Sender,
      BaseSender.PlatformMap,
      BaseProfiler.PlatformMap,
      BaseMarshaler.TypeList,
    ]);

    expect(sender).toBeInstanceOf(WhatsAppSender);
    expect(bots.get('whatsapp')).toBe(sender);
    expect(profilers.get('whatsapp')).toBeInstanceOf(WhatsAppProfiler);
    expect(marshalTypes).toEqual(
      expect.arrayContaining([
        WhatsAppAgent,
        WhatsAppChat,
        WhatsAppUser,
        WhatsAppUserProfile,
      ]),
    );

    sender.stop();
  });

  test('with configs.agentSettings', async () => {
    const app = Sociably.createApp({
      modules: [
        Http.initModule({ noServer: true, entryUrl: 'http://sociably.io' }),
        InMemoryState.initModule(),
      ],
      platforms: [
        WhatsApp.initModule({
          agentSettings,
          accessToken: '_ACCESS_TOKEN_',
          appId: '_APP_ID_',
          appSecret: '_APP_SECRET_',
          webhookVerifyToken: '_VERIFY_TOKEN_',
        }),
      ],
    });
    await app.start();
    const [agentSettingsAccessor] = app.useServices([AgentSettingsAccessorI]);

    const agent = new WhatsAppAgent('1111111111');
    const unknownAgent = new WhatsAppAgent('2222222222');

    await expect(
      agentSettingsAccessor.getAgentSettings(agent),
    ).resolves.toEqual(agentSettings);
    await expect(
      agentSettingsAccessor.getAgentSettings(unknownAgent),
    ).resolves.toBe(null);

    await expect(
      agentSettingsAccessor.getAgentSettingsBatch([agent, unknownAgent]),
    ).resolves.toEqual([agentSettings, null]);

    await app.stop();
  });

  test('with configs.multiPageSettings', async () => {
    const businessAccountSettings = [
      {
        businessAccountId: '9999999999',
        numbers: [
          { numberId: '1111111111', phoneNumber: '+1234567890' },
          { numberId: '2222222222', phoneNumber: '+9876543210' },
        ],
      },
      {
        businessAccountId: '8888888888',
        numbers: [{ numberId: '3333333333', phoneNumber: '+1111111111' }],
      },
    ];
    const app = Sociably.createApp({
      modules: [
        Http.initModule({ noServer: true, entryUrl: 'http://sociably.io' }),
        InMemoryState.initModule(),
      ],
      platforms: [
        WhatsApp.initModule({
          multiAgentSettings: businessAccountSettings,
          accessToken: '_ACCESS_TOKEN_',
          appId: '_APP_ID_',
          appSecret: '_APP_SECRET_',
          webhookVerifyToken: '_VERIFY_TOKEN_',
        }),
      ],
    });
    await app.start();
    const [agentSettingsAccessor] = app.useServices([AgentSettingsAccessorI]);

    const agent1 = new WhatsAppAgent('1111111111');
    const agentSettings1 = {
      numberId: '1111111111',
      phoneNumber: '+1234567890',
      businessAccountId: '9999999999',
    };
    const agent2 = new WhatsAppAgent('2222222222');
    const agentSettings2 = {
      numberId: '2222222222',
      phoneNumber: '+9876543210',
      businessAccountId: '9999999999',
    };
    const agent3 = new WhatsAppAgent('3333333333');
    const agentSettings3 = {
      numberId: '3333333333',
      phoneNumber: '+1111111111',
      businessAccountId: '8888888888',
    };
    const unknownAgent = new WhatsAppAgent('4444444444');

    await expect(
      agentSettingsAccessor.getAgentSettings(agent1),
    ).resolves.toEqual(agentSettings1);
    await expect(
      agentSettingsAccessor.getAgentSettings(agent2),
    ).resolves.toEqual(agentSettings2);
    await expect(
      agentSettingsAccessor.getAgentSettings(agent3),
    ).resolves.toEqual(agentSettings3);
    await expect(
      agentSettingsAccessor.getAgentSettings(unknownAgent),
    ).resolves.toBe(null);

    await expect(
      agentSettingsAccessor.getAgentSettingsBatch([
        agent2,
        agent3,
        unknownAgent,
      ]),
    ).resolves.toEqual([agentSettings2, agentSettings3, null]);

    await app.stop();
  });

  test('with configs.agentSettingsService', async () => {
    const settingsAccessor = {
      getAgentSettings: async () => agentSettings,
      getAgentSettingsBatch: async () => [agentSettings, agentSettings],
    };
    const MyAgentSettingsServiceI = serviceInterface({
      name: 'MyAgentSettingsService',
    });
    const myAgentSettingsService = serviceProviderFactory({})(
      () => settingsAccessor,
    );

    const app = Sociably.createApp({
      modules: [
        Http.initModule({ noServer: true, entryUrl: 'http://sociably.io' }),
        InMemoryState.initModule(),
      ],
      platforms: [
        WhatsApp.initModule({
          agentSettingsService: MyAgentSettingsServiceI,
          accessToken: '_ACCESS_TOKEN_',
          appId: '_APP_ID_',
          appSecret: '_APP_SECRET_',
          webhookVerifyToken: '_VERIFY_TOKEN_',
        }),
      ],
      services: [
        {
          provide: MyAgentSettingsServiceI,
          withProvider: myAgentSettingsService,
        },
      ],
    });
    await app.start();
    const [agentSettingsAccessor] = app.useServices([AgentSettingsAccessorI]);

    expect(agentSettingsAccessor).toBe(settingsAccessor);
    await app.stop();
  });

  test('default webhookPath to "."', async () => {
    const app = Sociably.createApp({
      modules: [
        Http.initModule({ noServer: true, entryUrl: 'http://sociably.io' }),
        InMemoryState.initModule(),
      ],
      platforms: [
        WhatsApp.initModule({
          agentSettings,
          accessToken: '_ACCESS_TOKEN_',
          shouldHandleChallenge: false,
          webhookVerifyToken: '',
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

    app.useServices([WhatsApp.Sender])[0].stop();
  });

  test('#startHook() start sender', async () => {
    const sender = moxy({ start: async () => {} });
    const module = WhatsApp.initModule({
      agentSettings,
      accessToken: '_ACCESS_TOKEN_',
      appId: '_APP_ID_',
      appSecret: '_APP_SECRET_',
      webhookVerifyToken: '_VERIFY_TOKEN_',
    });

    await expect(module.startHook!.$$factory(sender)).resolves.toBe(undefined);
    expect(sender.start).toHaveBeenCalledTimes(1);
  });

  test('#stopHook() stop sender', async () => {
    const sender = moxy({ stop: async () => {} });
    const module = WhatsApp.initModule({
      agentSettings,
      accessToken: '_ACCESS_TOKEN_',
      appId: '_APP_ID_',
      appSecret: '_APP_SECRET_',
      webhookVerifyToken: '_VERIFY_TOKEN_',
    });

    await expect(module.stopHook!.$$factory(sender)).resolves.toBe(undefined);
    expect(sender.stop).toHaveBeenCalledTimes(1);
  });
});
