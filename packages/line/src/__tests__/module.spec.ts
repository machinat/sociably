import moxy from '@moxyjs/moxy';
import Sociably from '@sociably/core';
import { serviceProviderFactory } from '@sociably/core/service';
import BaseBot from '@sociably/core/base/Bot';
import BaseProfiler from '@sociably/core/base/Profiler';
import BaseMarshaler from '@sociably/core/base/Marshaler';
import Http from '@sociably/http';
import Line from '../module';
import { LineReceiver } from '../Receiver';
import LineUserProfile from '../UserProfile';
import LineGroupProfile from '../GroupProfile';
import { LineProfiler } from '../Profiler';
import { AgentSettingsAccessorI } from '../interface';
import { LineBot } from '../Bot';
import LineChannel from '../Channel';
import LineUser from '../User';
import LineChat from '../Chat';

it('export interfaces', () => {
  expect(Line.Receiver).toBe(LineReceiver);
  expect(Line.Bot).toBe(LineBot);
  expect(Line.Profiler).toBe(LineProfiler);
  expect(Line.Configs).toMatchInlineSnapshot(`
    Object {
      "$$multi": false,
      "$$name": "LineConfigs",
      "$$polymorphic": false,
      "$$typeof": Symbol(interface.service.sociably),
    }
  `);
});

describe('initModule(configs)', () => {
  it('create module object', () => {
    const eventMiddlewares = [(ctx, next) => next(ctx)];
    const dispatchMiddlewares = [(ctx, next) => next(ctx)];

    const module = Line.initModule({
      channelSettings: {
        providerId: '_PROVIDER_ID_',
        channelId: '_CHANNEL_ID_',
        channelSecret: '_CHANNEL_SECRET_',
        accessToken: '_ACCESS_TOKEN_',
      },
      eventMiddlewares,
      dispatchMiddlewares,
    });

    expect(module.name).toBe('line');
    expect(module.utilitiesInterface).toMatchInlineSnapshot(`
      Object {
        "$$multi": false,
        "$$name": "LinePlatformUtilities",
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
      channelSettings: {
        providerId: '_PROVIDER_ID_',
        channelId: '_CHANNEL_ID_',
        channelSecret: '_CHANNEL_SECRET_',
        accessToken: '_ACCESS_TOKEN_',
      },
      webhookPath: '/webhook/line',
      eventMiddlewares: [(ctx, next) => next(ctx)],
    };

    const app = Sociably.createApp({
      platforms: [Line.initModule(configs)],
    });
    await app.start();

    const [bot, receiver, configsProvided, profiler, routings] =
      app.useServices([
        Line.Bot,
        Line.Receiver,
        Line.Configs,
        Line.Profiler,
        Http.RequestRouteList,
      ]);

    expect(bot).toBeInstanceOf(LineBot);
    expect(receiver).toBeInstanceOf(LineReceiver);
    expect(profiler).toBeInstanceOf(LineProfiler);
    expect(configsProvided).toEqual(configs);
    expect(routings).toEqual([
      { name: 'line', path: '/webhook/line', handler: expect.any(Function) },
    ]);
  });

  test('with options.channelSettings', async () => {
    const configs = {
      channelSettings: {
        providerId: '_PROVIDER_ID_',
        channelId: '_CHANNEL_ID_',
        channelSecret: '_CHANNEL_SECRET_',
        accessToken: '_ACCESS_TOKEN_',
        liff: { default: '_LOGIN_CHANNEL_ID_-_LIFF_SHORT_ID_' },
      },
    };

    const app = Sociably.createApp({
      platforms: [Line.initModule(configs)],
    });
    await app.start();

    const [settingsAccessor] = app.useServices([AgentSettingsAccessorI]);

    await expect(
      settingsAccessor.getAgentSettings(new LineChannel('_CHANNEL_ID_'))
    ).resolves.toEqual(configs.channelSettings);
    await expect(
      settingsAccessor.getAgentSettings(new LineChannel('_WRONG_CHANNEL_'))
    ).resolves.toBe(null);

    await expect(
      settingsAccessor.getAgentSettingsBatch([
        new LineChannel('_CHANNEL_ID_'),
        new LineChannel('_WRONG_CHANNEL_'),
      ])
    ).resolves.toEqual([configs.channelSettings, null]);

    await expect(
      settingsAccessor.getLineChatChannelSettingsByBotUserId('_BOT_ID_')
    ).resolves.toEqual(configs.channelSettings);

    await expect(
      settingsAccessor.getLineLoginChannelSettings('_LOGIN_CHANNEL_ID_')
    ).resolves.toEqual({
      providerId: '_PROVIDER_ID_',
      channelId: '_LOGIN_CHANNEL_ID_',
      liffIds: ['_LOGIN_CHANNEL_ID_-_LIFF_SHORT_ID_'],
      refChatChannelIds: ['_CHANNEL_ID_'],
    });
    await expect(
      settingsAccessor.getLineLoginChannelSettings('_WRONG_CHANNEL_')
    ).resolves.toBe(null);
  });

  test('with options.multiChannelSettings', async () => {
    const app = Sociably.createApp({
      platforms: [
        Line.initModule({
          multiChannelSettings: [
            {
              providerId: '_PROVIDER_ID_1_',
              channels: [
                {
                  botUserId: '_BOT_ID_1_',
                  channelId: '_CHANNEL_ID_1_',
                  channelSecret: '_CHANNEL_SECRET_1_',
                  accessToken: '_ACCESS_TOKEN_1_',
                  liff: { default: '_LOGIN_CHANNEL_ID_1_-_LIFF_SHORT_ID_1_' },
                },
                {
                  botUserId: '_BOT_ID_2_',
                  channelId: '_CHANNEL_ID_2_',
                  channelSecret: '_CHANNEL_SECRET_2_',
                  accessToken: '_ACCESS_TOKEN_2_',
                  liff: { default: '_LOGIN_CHANNEL_ID_1_-_LIFF_SHORT_ID_2_' },
                },
              ],
            },
            {
              providerId: '_PROVIDER_ID_2_',
              channels: [
                {
                  botUserId: '_BOT_ID_3_',
                  channelId: '_CHANNEL_ID_3_',
                  channelSecret: '_CHANNEL_SECRET_3_',
                  accessToken: '_ACCESS_TOKEN_3_',
                  liff: { default: '_LOGIN_CHANNEL_ID_2_-_LIFF_SHORT_ID_3_' },
                },
              ],
            },
          ],
        }),
      ],
    });
    await app.start();

    const [settingsAccessor] = app.useServices([AgentSettingsAccessorI]);

    const expectedChannel1Settings = {
      botUserId: '_BOT_ID_1_',
      providerId: '_PROVIDER_ID_1_',
      channelId: '_CHANNEL_ID_1_',
      channelSecret: '_CHANNEL_SECRET_1_',
      accessToken: '_ACCESS_TOKEN_1_',
      liff: { default: '_LOGIN_CHANNEL_ID_1_-_LIFF_SHORT_ID_1_' },
    };
    const expectedChannel2Settings = {
      botUserId: '_BOT_ID_2_',
      providerId: '_PROVIDER_ID_1_',
      channelId: '_CHANNEL_ID_2_',
      channelSecret: '_CHANNEL_SECRET_2_',
      accessToken: '_ACCESS_TOKEN_2_',
      liff: { default: '_LOGIN_CHANNEL_ID_1_-_LIFF_SHORT_ID_2_' },
    };
    const expectedChannel3Settings = {
      botUserId: '_BOT_ID_3_',
      providerId: '_PROVIDER_ID_2_',
      channelId: '_CHANNEL_ID_3_',
      channelSecret: '_CHANNEL_SECRET_3_',
      accessToken: '_ACCESS_TOKEN_3_',
      liff: { default: '_LOGIN_CHANNEL_ID_2_-_LIFF_SHORT_ID_3_' },
    };

    await expect(
      settingsAccessor.getAgentSettings(new LineChannel('_CHANNEL_ID_1_'))
    ).resolves.toEqual(expectedChannel1Settings);
    await expect(
      settingsAccessor.getAgentSettings(new LineChannel('_CHANNEL_ID_2_'))
    ).resolves.toEqual(expectedChannel2Settings);
    await expect(
      settingsAccessor.getAgentSettings(new LineChannel('_CHANNEL_ID_3_'))
    ).resolves.toEqual(expectedChannel3Settings);
    await expect(
      settingsAccessor.getAgentSettings(new LineChannel('_WRONG_CHANNEL_'))
    ).resolves.toBe(null);

    await expect(
      settingsAccessor.getAgentSettingsBatch([
        new LineChannel('_CHANNEL_ID_2_'),
        new LineChannel('_CHANNEL_ID_3_'),
        new LineChannel('_WRONG_CHANNEL_'),
      ])
    ).resolves.toEqual([
      expectedChannel2Settings,
      expectedChannel3Settings,
      null,
    ]);

    await expect(
      settingsAccessor.getLineChatChannelSettingsByBotUserId('_BOT_ID_1_')
    ).resolves.toEqual(expectedChannel1Settings);
    await expect(
      settingsAccessor.getLineChatChannelSettingsByBotUserId('_BOT_ID_2_')
    ).resolves.toEqual(expectedChannel2Settings);
    await expect(
      settingsAccessor.getLineChatChannelSettingsByBotUserId('_BOT_ID_3_')
    ).resolves.toEqual(expectedChannel3Settings);

    await expect(
      settingsAccessor.getLineLoginChannelSettings('_LOGIN_CHANNEL_ID_1_')
    ).resolves.toEqual({
      providerId: '_PROVIDER_ID_1_',
      channelId: '_LOGIN_CHANNEL_ID_1_',
      liffIds: [
        '_LOGIN_CHANNEL_ID_1_-_LIFF_SHORT_ID_1_',
        '_LOGIN_CHANNEL_ID_1_-_LIFF_SHORT_ID_2_',
      ],
      refChatChannelIds: ['_CHANNEL_ID_1_', '_CHANNEL_ID_2_'],
    });
    await expect(
      settingsAccessor.getLineLoginChannelSettings('_LOGIN_CHANNEL_ID_2_')
    ).resolves.toEqual({
      providerId: '_PROVIDER_ID_2_',
      channelId: '_LOGIN_CHANNEL_ID_2_',
      liffIds: ['_LOGIN_CHANNEL_ID_2_-_LIFF_SHORT_ID_3_'],
      refChatChannelIds: ['_CHANNEL_ID_3_'],
    });
    await expect(
      settingsAccessor.getLineLoginChannelSettings('_WRONG_CHANNEL_')
    ).resolves.toBe(null);
  });

  test('with options.channelSettings', async () => {
    const channelSettingsAccessor = {
      getAgentSettings: async () => null,
      getAgentSettingsBatch: async () => [],
      getLineChatChannelSettingsByBotUserId: async () => null,
      getLineLoginChannelSettings: async () => null,
    };
    const channelSettingsService = serviceProviderFactory({})(
      () => channelSettingsAccessor
    );

    const app = Sociably.createApp({
      platforms: [Line.initModule({ channelSettingsService })],
      services: [channelSettingsService],
    });
    await app.start();

    const [acquiredAgentSettingsAccessor] = app.useServices([
      AgentSettingsAccessorI,
    ]);

    expect(acquiredAgentSettingsAccessor).toBe(channelSettingsAccessor);
  });

  it('throws if no channel settings source provided', async () => {
    expect(() => Line.initModule({})).toThrowErrorMatchingInlineSnapshot(
      `"Line platform requires one of \`channelSettings\`, \`multiChannelSettings\` or \`channelSettingsService\` option"`
    );
  });

  test('provide base interfaces', async () => {
    const app = Sociably.createApp({
      platforms: [
        Line.initModule({
          channelSettings: {
            providerId: '_PROVIDER_ID_',
            channelId: '_CHANNEL_ID_',
            channelSecret: '_CHANNEL_SECRET_',
            accessToken: '_ACCESS_TOKEN_',
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

    expect(bots.get('line')).toBeInstanceOf(LineBot);
    expect(profilers.get('line')).toBeInstanceOf(LineProfiler);
    expect(marshalTypes).toEqual(
      expect.arrayContaining([
        LineChannel,
        LineChat,
        LineUser,
        LineUserProfile,
        LineGroupProfile,
      ])
    );
  });

  test('default webhookPath to "/"', async () => {
    const configs = {
      channelSettings: {
        providerId: '_PROVIDER_ID_',
        channelId: '_CHANNEL_ID_',
        channelSecret: '_CHANNEL_SECRET_',
        accessToken: '_ACCESS_TOKEN_',
      },
      shouldVerifyRequest: false,
    };

    const app = Sociably.createApp({
      platforms: [Line.initModule(configs)],
    });
    await app.start();

    const [routings] = app.useServices([Http.RequestRouteList]);
    expect(routings).toEqual([
      { name: 'line', path: '/', handler: expect.any(Function) },
    ]);
  });

  test('#startHook() start bot', async () => {
    const bot = moxy({ start: async () => {} });
    const module = Line.initModule({
      channelSettings: {
        providerId: '_PROVIDER_ID_',
        channelId: '_CHANNEL_ID_',
        channelSecret: '_CHANNEL_SECRET_',
        accessToken: '_ACCESS_TOKEN_',
      },
      shouldVerifyRequest: false,
    });

    await expect(module.startHook!.$$factory(bot)).resolves.toBe(undefined);
    expect(bot.start).toHaveBeenCalledTimes(1);
  });

  test('#stopHook() stop bot', async () => {
    const bot = moxy({ stop: async () => {} });
    const module = Line.initModule({
      channelSettings: {
        providerId: '_PROVIDER_ID_',
        channelId: '_CHANNEL_ID_',
        channelSecret: '_CHANNEL_SECRET_',
        accessToken: '_ACCESS_TOKEN_',
      },
      shouldVerifyRequest: false,
    });

    await expect(module.stopHook!.$$factory(bot)).resolves.toBe(undefined);
    expect(bot.stop).toHaveBeenCalledTimes(1);
  });
});
