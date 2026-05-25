import moxy from '@moxyjs/moxy';
import Sociably from '@sociably/core';
import { serviceProviderFactory } from '@sociably/core/service';
import BaseSender from '@sociably/core/base/Sender.js';
import BaseProfiler from '@sociably/core/base/Profiler.js';
import BaseMarshaler from '@sociably/core/base/Marshaler.js';
import Http from '@sociably/http';
import { InMemoryState } from '@sociably/dev-tools';
import Facebook from '../module.js';
import { AgentSettingsAccessorI } from '../interface.js';
import {
  FacebookAssetsManager,
  saveReusableAttachments,
} from '../asset/index.js';
import FacebookPage from '../Page.js';
import FacebookChat from '../Chat.js';
import FacebookUser from '../User.js';
import FacebookUserProfile from '../UserProfile.js';
import { FacebookProfiler } from '../Profiler.js';
import { FacebookReceiver } from '../Receiver.js';
import { FacebookSender } from '../Sender.js';
import type {
  FacebookDispatchMiddleware,
  FacebookEventMiddleware,
} from '../types.js';

it('export interfaces', () => {
  expect(Facebook.Receiver).toBe(FacebookReceiver);
  expect(Facebook.Sender).toBe(FacebookSender);
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
    const eventMiddleware: FacebookEventMiddleware = (ctx, next) => next(ctx);
    const dispatchMiddleware: FacebookDispatchMiddleware = (ctx, next) =>
      next(ctx);

    const module = Facebook.initModule({
      agentSettings: {
        pageId: '1234567890',
        accessToken: '_ACCESS_TOKEN_',
      },
      appId: '_APP_ID_',
      appSecret: '_APP_SECRET_',
      webhookVerifyToken: '_VERIFY_TOKEN_',
      eventMiddlewares: [eventMiddleware],
      dispatchMiddlewares: [dispatchMiddleware],
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
    expect(module.eventMiddlewares).toEqual([eventMiddleware]);
    expect(module.dispatchMiddlewares).toEqual(
      expect.arrayContaining([dispatchMiddleware, saveReusableAttachments]),
    );
  });

  test('provisions', async () => {
    const configs = {
      agentSettings: {
        pageId: '1234567890',
        accessToken: '_ACCESS_TOKEN_',
      },
      appId: '_APP_ID_',
      appSecret: '_APP_SECRET_',
      webhookVerifyToken: '_VERIFY_TOKEN_',
      webhookPath: 'webhook/facebook',
      eventMiddlewares: [((ctx, next) => next(ctx)) as FacebookEventMiddleware],
    };

    const app = Sociably.createApp({
      modules: [
        Http.initModule({ entryUrl: 'https://sociably.io', noServer: true }),
        InMemoryState.initModule(),
      ],
      platforms: [Facebook.initModule(configs)],
    });
    await app.start();

    const [
      sender,
      receiver,
      profiler,
      configsProvided,
      assetManager,
      routings,
      agentSettingsAccessor,
    ] = app.useServices([
      Facebook.Sender,
      Facebook.Receiver,
      Facebook.Profiler,
      Facebook.Configs,
      Facebook.AssetsManager,
      Http.RequestRouteList,
      AgentSettingsAccessorI,
    ]);

    expect(sender).toBeInstanceOf(FacebookSender);
    expect(receiver).toBeInstanceOf(FacebookReceiver);
    expect(profiler).toBeInstanceOf(FacebookProfiler);
    expect(assetManager).toBeInstanceOf(FacebookAssetsManager);
    expect(configsProvided).toEqual(configs);
    expect(routings).toEqual([
      {
        name: 'facebook',
        path: 'webhook/facebook',
        handler: expect.any(Function),
      },
    ]);
    expect(agentSettingsAccessor).toEqual({
      getAgentSettings: expect.any(Function),
      getAgentSettingsBatch: expect.any(Function),
    });

    sender.stop();
  });

  test('provide base interfaces', async () => {
    const app = Sociably.createApp({
      modules: [
        Http.initModule({ entryUrl: 'https://sociably.io', noServer: true }),
        InMemoryState.initModule(),
      ],
      platforms: [
        Facebook.initModule({
          agentSettings: {
            pageId: '1234567890',
            accessToken: '_ACCESS_TOKEN_',
          },
          appId: '_APP_ID_',
          appSecret: '_APP_SECRET_',
          webhookVerifyToken: '_VERIFY_TOKEN_',
        }),
      ],
    });
    await app.start();

    const [sender, bots, profilers, marshalTypes] = app.useServices([
      Facebook.Sender,
      BaseSender.PlatformMap,
      BaseProfiler.PlatformMap,
      BaseMarshaler.TypeList,
    ]);

    expect(sender).toBeInstanceOf(FacebookSender);
    expect(bots.get('facebook')).toBe(sender);
    expect(profilers.get('facebook')).toBeInstanceOf(FacebookProfiler);
    expect(marshalTypes).toEqual(
      expect.arrayContaining([
        FacebookPage,
        FacebookChat,
        FacebookUser,
        FacebookUserProfile,
      ]),
    );

    sender.stop();
  });

  test('default webhookPath to "."', async () => {
    const app = Sociably.createApp({
      modules: [
        Http.initModule({ entryUrl: 'https://sociably.io', noServer: true }),
        InMemoryState.initModule(),
      ],
      platforms: [
        Facebook.initModule({
          agentSettings: {
            pageId: '1234567890',
            accessToken: '_ACCESS_TOKEN_',
          },
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
        name: 'facebook',
        path: '.',
        handler: expect.any(Function),
      },
    ]);

    app.useServices([Facebook.Sender])[0].stop();
  });

  test('with configs.agentSettings', async () => {
    const agentSettings = {
      pageId: '1234567890',
      accessToken: '_ACCESS_TOKEN_',
    };
    const app = Sociably.createApp({
      modules: [
        Http.initModule({ entryUrl: 'https://sociably.io', noServer: true }),
        InMemoryState.initModule(),
      ],
      platforms: [
        Facebook.initModule({
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
      agentSettingsAccessor.getAgentSettings(new FacebookPage('1234567890')),
    ).resolves.toEqual(agentSettings);
    await expect(
      agentSettingsAccessor.getAgentSettings(new FacebookPage('9876543210')),
    ).resolves.toEqual(null);

    await expect(
      agentSettingsAccessor.getAgentSettingsBatch([
        new FacebookPage('1234567890'),
        new FacebookPage('9876543210'),
      ]),
    ).resolves.toEqual([agentSettings, null]);

    await app.stop();
  });

  test('with configs.multiAgentSettings', async () => {
    const app = Sociably.createApp({
      modules: [
        Http.initModule({ entryUrl: 'https://sociably.io', noServer: true }),
        InMemoryState.initModule(),
      ],
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
          webhookVerifyToken: '_VERIFY_TOKEN_',
        }),
      ],
    });
    await app.start();
    const [agentSettingsAccessor] = app.useServices([AgentSettingsAccessorI]);

    await expect(
      agentSettingsAccessor.getAgentSettings(new FacebookPage('1234567890')),
    ).resolves.toEqual({
      pageId: '1234567890',
      accessToken: '_ACCESS_TOKEN_1_',
    });
    await expect(
      agentSettingsAccessor.getAgentSettings(new FacebookPage('9876543210')),
    ).resolves.toEqual({
      pageId: '9876543210',
      accessToken: '_ACCESS_TOKEN_2_',
    });
    await expect(
      agentSettingsAccessor.getAgentSettings(new FacebookPage('8888888888')),
    ).resolves.toBe(null);

    await expect(
      agentSettingsAccessor.getAgentSettingsBatch([
        new FacebookPage('9876543210'),
        new FacebookPage('1234567890'),
        new FacebookPage('8888888888'),
      ]),
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
      () => settingsAccessor,
    );

    const app = Sociably.createApp({
      modules: [
        Http.initModule({ entryUrl: 'https://sociably.io', noServer: true }),
        InMemoryState.initModule(),
      ],
      platforms: [
        Facebook.initModule({
          agentSettingsService: myPageSettingsService,
          appId: '_APP_ID_',
          appSecret: '_APP_SECRET_',
          webhookVerifyToken: '_VERIFY_TOKEN_',
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
        webhookVerifyToken: '...',
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      `"Facebook platform requires one of \`agentSettings\`, \`multiAgentSettings\` or \`agentSettingsService\` option"`,
    );
  });

  test('#startHook() start sender', async () => {
    const sender = moxy({ start: async () => {} });
    const module = Facebook.initModule({
      agentSettings: {
        pageId: '1234567890',
        accessToken: '_ACCESS_TOKEN_',
      },
      appId: '...',
      appSecret: '...',
      webhookVerifyToken: '...',
    });

    await expect(module.startHook!.$$factory(sender)).resolves.toBe(undefined);
    expect(sender.start).toHaveBeenCalledTimes(1);
  });

  test('#stopHook() stop sender', async () => {
    const sender = moxy<FacebookSender>({ stop: async () => {} } as never);
    const module = Facebook.initModule({
      agentSettings: {
        pageId: '1234567890',
        accessToken: '_ACCESS_TOKEN_',
      },
      appId: '...',
      appSecret: '...',
      webhookVerifyToken: '...',
    });

    await expect(module.stopHook!.$$factory(sender)).resolves.toBe(undefined);
    expect(sender.stop).toHaveBeenCalledTimes(1);
  });
});
