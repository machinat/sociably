import moxy from '@moxyjs/moxy';
import Sociably from '@sociably/core';
import { serviceProviderFactory } from '@sociably/core/service';
import BaseBot from '@sociably/core/base/Bot';
import BaseProfiler from '@sociably/core/base/Profiler';
import BaseMarshaler from '@sociably/core/base/Marshaler';
import Http from '@sociably/http';
import Facebook from '../module';
import { PageSettingsAccessorI } from '../interface';
import FacebookPage from '../Page';
import FacebookChat from '../Chat';
import FacebookUser from '../User';
import FacebookUserProfile from '../UserProfile';
import { FacebookProfiler } from '../Profiler';
import { FacebookReceiver } from '../Receiver';
import { FacebookBot } from '../Bot';

it('export interfaces', () => {
  expect(Facebook.Receiver).toBe(FacebookReceiver);
  expect(Facebook.Bot).toBe(FacebookBot);
  expect(Facebook.Profiler).toBe(FacebookProfiler);
  expect(Facebook.Configs).toMatchInlineSnapshot(`
    Object {
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
      pageSettings: {
        pageId: '1234567890',
        accessToken: '_ACCESS_TOKEN_',
      },
      appSecret: '_APP_SECRET_',
      verifyToken: '_VERIFY_TOKEN_',
      eventMiddlewares,
      dispatchMiddlewares,
    });

    expect(module.name).toBe('facebook');
    expect(module.utilitiesInterface).toMatchInlineSnapshot(`
      Object {
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
      pageSettings: {
        pageId: '1234567890',
        accessToken: '_ACCESS_TOKEN_',
      },
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
      pageSettingsAccessor,
    ] = app.useServices([
      Facebook.Bot,
      Facebook.Receiver,
      Facebook.Profiler,
      Facebook.Configs,
      Http.RequestRouteList,
      PageSettingsAccessorI,
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
    expect(pageSettingsAccessor).toEqual({
      getAgentSettings: expect.any(Function),
      getAgentSettingsBatch: expect.any(Function),
    });

    bot.stop();
  });

  test('provide base interfaces', async () => {
    const app = Sociably.createApp({
      platforms: [
        Facebook.initModule({
          pageSettings: {
            pageId: '1234567890',
            accessToken: '_ACCESS_TOKEN_',
          },
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
          pageSettings: {
            pageId: '1234567890',
            accessToken: '_ACCESS_TOKEN_',
          },
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

  test('with configs.pageSettings', async () => {
    const pageSettings = {
      pageId: '1234567890',
      accessToken: '_ACCESS_TOKEN_',
    };
    const app = Sociably.createApp({
      platforms: [
        Facebook.initModule({
          pageSettings,
          appSecret: '_APP_SECRET_',
          verifyToken: '_VERIFY_TOKEN_',
        }),
      ],
    });
    await app.start();
    const [pageSettingsAccessor] = app.useServices([PageSettingsAccessorI]);

    await expect(
      pageSettingsAccessor.getAgentSettings(new FacebookPage('1234567890'))
    ).resolves.toEqual(pageSettings);
    await expect(
      pageSettingsAccessor.getAgentSettings(new FacebookPage('9876543210'))
    ).resolves.toEqual(null);

    await expect(
      pageSettingsAccessor.getAgentSettingsBatch([
        new FacebookPage('1234567890'),
        new FacebookPage('9876543210'),
      ])
    ).resolves.toEqual([pageSettings, null]);

    await app.stop();
  });

  test('with configs.multiPageSettings', async () => {
    const app = Sociably.createApp({
      platforms: [
        Facebook.initModule({
          multiPageSettings: [
            {
              pageId: '1234567890',
              accessToken: '_ACCESS_TOKEN_1_',
            },
            {
              pageId: '9876543210',
              accessToken: '_ACCESS_TOKEN_2_',
            },
          ],
          appSecret: '_APP_SECRET_',
          verifyToken: '_VERIFY_TOKEN_',
        }),
      ],
    });
    await app.start();
    const [pageSettingsAccessor] = app.useServices([PageSettingsAccessorI]);

    await expect(
      pageSettingsAccessor.getAgentSettings(new FacebookPage('1234567890'))
    ).resolves.toEqual({
      pageId: '1234567890',
      accessToken: '_ACCESS_TOKEN_1_',
    });
    await expect(
      pageSettingsAccessor.getAgentSettings(new FacebookPage('9876543210'))
    ).resolves.toEqual({
      pageId: '9876543210',
      accessToken: '_ACCESS_TOKEN_2_',
    });
    await expect(
      pageSettingsAccessor.getAgentSettings(new FacebookPage('8888888888'))
    ).resolves.toBe(null);

    await expect(
      pageSettingsAccessor.getAgentSettingsBatch([
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

  test('with configs.pageSettingsService', async () => {
    const pageSettings = {
      pageId: '1234567890',
      accessToken: '_ACCESS_TOKEN_',
    };
    const settingsAccessor = {
      getAgentSettings: async () => pageSettings,
      getAgentSettingsBatch: async () => [pageSettings, pageSettings],
    };
    const myPageSettingsService = serviceProviderFactory({})(
      () => settingsAccessor
    );

    const app = Sociably.createApp({
      platforms: [
        Facebook.initModule({
          pageSettingsService: myPageSettingsService,
          appSecret: '_APP_SECRET_',
          verifyToken: '_VERIFY_TOKEN_',
        }),
      ],
      services: [myPageSettingsService],
    });
    await app.start();
    const [pageSettingsAccessor] = app.useServices([PageSettingsAccessorI]);

    expect(pageSettingsAccessor).toBe(settingsAccessor);
    await app.stop();
  });

  it('throw if no page settings source provided', () => {
    expect(() =>
      Facebook.initModule({
        appSecret: '_APP_SECRET_',
        verifyToken: '_VERIFY_TOKEN_',
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"Facebook platform requires one of \`pageSettings\`, \`multiPageSettings\` or \`pageSettingsService\` option"`
    );
  });

  test('#startHook() start bot', async () => {
    const bot = moxy({ start: async () => {} });
    const module = Facebook.initModule({
      pageSettings: {
        pageId: '1234567890',
        accessToken: '_ACCESS_TOKEN_',
      },
      appSecret: '...',
      verifyToken: '...',
    });

    await expect(module.startHook!.$$factory(bot)).resolves.toBe(undefined);
    expect(bot.start).toHaveBeenCalledTimes(1);
  });

  test('#stopHook() stop bot', async () => {
    const bot = moxy<FacebookBot>({ stop: async () => {} } as never);
    const module = Facebook.initModule({
      pageSettings: {
        pageId: '1234567890',
        accessToken: '_ACCESS_TOKEN_',
      },
      appSecret: '...',
      verifyToken: '...',
    });

    await expect(module.stopHook!.$$factory(bot)).resolves.toBe(undefined);
    expect(bot.stop).toHaveBeenCalledTimes(1);
  });
});
