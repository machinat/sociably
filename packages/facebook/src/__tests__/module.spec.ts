import { moxy } from '@moxyjs/moxy';
import Sociably from '@sociably/core';
import { serviceProviderFactory } from '@sociably/core/service';
import BaseBot from '@sociably/core/base/Bot';
import BaseProfiler from '@sociably/core/base/Profiler';
import BaseMarshaler from '@sociably/core/base/Marshaler';
import Http from '@sociably/http';
import Facebook from '../module.js';
import { AgentSettingsAccessorI } from '../interface.js';
import FacebookPage from '../Page.js';
import FacebookChat from '../Chat.js';
import FacebookUser from '../User.js';
import FacebookUserProfile from '../UserProfile.js';
import { FacebookProfiler } from '../Profiler.js';
import { FacebookReceiver } from '../Receiver.js';
import { FacebookBot } from '../Bot.js';

it('export interfaces', () => {
  expect(Facebook.Receiver).toBe(FacebookReceiver);
  expect(Facebook.Bot).toBe(FacebookBot);
  expect(Facebook.Profiler).toBe(FacebookProfiler);
  expect(Facebook.Configs).toMatchInlineSnapshot(`
    {
      "$$multi": false,
      "$$name": "FacebookConfigs",
      "$$polymorphic": false,
      "$$typeof": Symbol(interface.service.sociably),
    }
  `);
});

describe('initModule(configs)', () => {
  it('create module object', () => {
    const eventMiddlewares = [(ctx, next) => next(ctx)];
    const dispatchMiddlewares = [(ctx, next) => next(ctx)];

    const module = Facebook.initModule({
      agentSettings: {
        pageId: '1234567890',
        accessToken: '_ACCESS_TOKEN_',
      },
      appId: '_APP_ID_',
      appSecret: '_APP_SECRET_',
      verifyToken: '_VERIFY_TOKEN_',
      eventMiddlewares,
      dispatchMiddlewares,
    });

    expect(module.name).toBe('facebook');
    expect(module.utilitiesInterface).toMatchInlineSnapshot(`
      {
        "$$multi": false,
        "$$name": "FacebookPlatformUtilities",
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
      agentSettings: {
        pageId: '1234567890',
        accessToken: '_ACCESS_TOKEN_',
      },
      appId: '_APP_ID_',
      appSecret: '_APP_SECRET_',
      verifyToken: '_VERIFY_TOKEN_',
      webhookPath: '/webhook/facebook',
      eventMiddlewares: [(ctx, next) => next(ctx)],
    };

    const app = Sociably.createApp({
      platforms: [Facebook.initModule(configs)],
    });
    await app.start();

    const [
      bot,
      receiver,
      profiler,
      configsProvided,
      routings,
      agentSettingsAccessor,
    ] = app.useServices([
      Facebook.Bot,
      Facebook.Receiver,
      Facebook.Profiler,
      Facebook.Configs,
      Http.RequestRouteList,
      AgentSettingsAccessorI,
    ]);

    expect(bot).toBeInstanceOf(FacebookBot);
    expect(receiver).toBeInstanceOf(FacebookReceiver);
    expect(profiler).toBeInstanceOf(FacebookProfiler);
    expect(configsProvided).toEqual(configs);
    expect(routings).toEqual([
      {
        name: 'facebook',
        path: '/webhook/facebook',
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
      platforms: [
        Facebook.initModule({
          agentSettings: {
            pageId: '1234567890',
            accessToken: '_ACCESS_TOKEN_',
          },
          appId: '_APP_ID_',
          appSecret: '_APP_SECRET_',
          verifyToken: '_VERIFY_TOKEN_',
        }),
      ],
    });
    await app.start();

    const [bot, bots, profilers, marshalTypes] = app.useServices([
      Facebook.Bot,
      BaseBot.PlatformMap,
      BaseProfiler.PlatformMap,
      BaseMarshaler.TypeList,
    ]);

    expect(bot).toBeInstanceOf(FacebookBot);
    expect(bots.get('facebook')).toBe(bot);
    expect(profilers.get('facebook')).toBeInstanceOf(FacebookProfiler);
    expect(marshalTypes).toEqual(
      expect.arrayContaining([
        FacebookPage,
        FacebookChat,
        FacebookUser,
        FacebookUserProfile,
      ])
    );

    bot.stop();
  });

  test('default webhookPath to "/"', async () => {
    const app = Sociably.createApp({
      platforms: [
        Facebook.initModule({
          agentSettings: {
            pageId: '1234567890',
            accessToken: '_ACCESS_TOKEN_',
          },
          appId: '...',
          appSecret: '...',
          verifyToken: '...',
          shouldHandleChallenge: false,
          shouldVerifyRequest: false,
        }),
      ],
    });
    await app.start();

    const [routings] = app.useServices([Http.RequestRouteList]);
    expect(routings).toEqual([
      { name: 'facebook', path: '/', handler: expect.any(Function) },
    ]);

    app.useServices([Facebook.Bot])[0].stop();
  });

  test('with configs.agentSettings', async () => {
    const agentSettings = {
      pageId: '1234567890',
      accessToken: '_ACCESS_TOKEN_',
    };
    const app = Sociably.createApp({
      platforms: [
        Facebook.initModule({
          agentSettings,
          appId: '_APP_ID_',
          appSecret: '_APP_SECRET_',
          verifyToken: '_VERIFY_TOKEN_',
        }),
      ],
    });
    await app.start();
    const [agentSettingsAccessor] = app.useServices([AgentSettingsAccessorI]);

    await expect(
      agentSettingsAccessor.getAgentSettings(new FacebookPage('1234567890'))
    ).resolves.toEqual(agentSettings);
    await expect(
      agentSettingsAccessor.getAgentSettings(new FacebookPage('9876543210'))
    ).resolves.toEqual(null);

    await expect(
      agentSettingsAccessor.getAgentSettingsBatch([
        new FacebookPage('1234567890'),
        new FacebookPage('9876543210'),
      ])
    ).resolves.toEqual([agentSettings, null]);

    await app.stop();
  });

  test('with configs.multiAgentSettings', async () => {
    const app = Sociably.createApp({
      platforms: [
        Facebook.initModule({
          multiAgentSettings: [
            {
              pageId: '1234567890',
              accessToken: '_ACCESS_TOKEN_1_',
            },
            {
              pageId: '9876543210',
              accessToken: '_ACCESS_TOKEN_2_',
            },
          ],
          appId: '_APP_ID_',
          appSecret: '_APP_SECRET_',
          verifyToken: '_VERIFY_TOKEN_',
        }),
      ],
    });
    await app.start();
    const [agentSettingsAccessor] = app.useServices([AgentSettingsAccessorI]);

    await expect(
      agentSettingsAccessor.getAgentSettings(new FacebookPage('1234567890'))
    ).resolves.toEqual({
      pageId: '1234567890',
      accessToken: '_ACCESS_TOKEN_1_',
    });
    await expect(
      agentSettingsAccessor.getAgentSettings(new FacebookPage('9876543210'))
    ).resolves.toEqual({
      pageId: '9876543210',
      accessToken: '_ACCESS_TOKEN_2_',
    });
    await expect(
      agentSettingsAccessor.getAgentSettings(new FacebookPage('8888888888'))
    ).resolves.toBe(null);

    await expect(
      agentSettingsAccessor.getAgentSettingsBatch([
        new FacebookPage('9876543210'),
        new FacebookPage('1234567890'),
        new FacebookPage('8888888888'),
      ])
    ).resolves.toEqual([
      { pageId: '9876543210', accessToken: '_ACCESS_TOKEN_2_' },
      { pageId: '1234567890', accessToken: '_ACCESS_TOKEN_1_' },
      null,
    ]);

    await app.stop();
  });

  test('with configs.agentSettingsService', async () => {
    const agentSettings = {
      pageId: '1234567890',
      accessToken: '_ACCESS_TOKEN_',
    };
    const settingsAccessor = {
      getAgentSettings: async () => agentSettings,
      getAgentSettingsBatch: async () => [agentSettings, agentSettings],
    };
    const myPageSettingsService = serviceProviderFactory({})(
      () => settingsAccessor
    );

    const app = Sociably.createApp({
      platforms: [
        Facebook.initModule({
          agentSettingsService: myPageSettingsService,
          appId: '_APP_ID_',
          appSecret: '_APP_SECRET_',
          verifyToken: '_VERIFY_TOKEN_',
        }),
      ],
      services: [myPageSettingsService],
    });
    await app.start();
    const [agentSettingsAccessor] = app.useServices([AgentSettingsAccessorI]);

    expect(agentSettingsAccessor).toBe(settingsAccessor);
    await app.stop();
  });

  it('throw if no page settings source provided', () => {
    expect(() =>
      Facebook.initModule({
        appId: '...',
        appSecret: '...',
        verifyToken: '...',
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"Facebook platform requires one of \`agentSettings\`, \`multiAgentSettings\` or \`agentSettingsService\` option"`
    );
  });

  test('#startHook() start bot', async () => {
    const bot = moxy({ start: async () => {} });
    const module = Facebook.initModule({
      agentSettings: {
        pageId: '1234567890',
        accessToken: '_ACCESS_TOKEN_',
      },
      appId: '...',
      appSecret: '...',
      verifyToken: '...',
    });

    await expect(module.startHook!.$$factory(bot)).resolves.toBe(undefined);
    expect(bot.start).toHaveBeenCalledTimes(1);
  });

  test('#stopHook() stop bot', async () => {
    const bot = moxy<FacebookBot>({ stop: async () => {} } as never);
    const module = Facebook.initModule({
      agentSettings: {
        pageId: '1234567890',
        accessToken: '_ACCESS_TOKEN_',
      },
      appId: '...',
      appSecret: '...',
      verifyToken: '...',
    });

    await expect(module.stopHook!.$$factory(bot)).resolves.toBe(undefined);
    expect(bot.stop).toHaveBeenCalledTimes(1);
  });
});
