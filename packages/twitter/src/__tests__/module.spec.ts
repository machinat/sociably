import moxy from '@moxyjs/moxy';
import Sociably from '@sociably/core';
import { makeInterface } from '@sociably/core/service';
import BaseBot from '@sociably/core/base/Bot';
import BaseProfiler from '@sociably/core/base/Profiler';
import BaseMarshaler from '@sociably/core/base/Marshaler';
import Http from '@sociably/http';
import Twitter from '../module';
import TwitterChat from '../Chat';
import TweetTarget from '../TweetTarget';
import TwitterUser from '../User';
import { TwitterReceiver } from '../Receiver';
import TwitterUserProfile from '../UserProfile';
import { TwitterProfiler } from '../Profiler';
import { TwitterBot } from '../Bot';
import { AgentSettingsAccessorI } from '../interface';

const basicConfigs = {
  agentSettings: {
    userId: '1234567890',
    accessToken: '__ACCESS_TOKEN__',
    tokenSecret: '__ACCESS_SECRET__',
  },
  appKey: '__APP_KEY__',
  appSecret: '__APP_SECRET__',
  bearerToken: '__BEARER_TOKEN__',
};

it('export interfaces', () => {
  expect(Twitter.Receiver).toBe(TwitterReceiver);
  expect(Twitter.Bot).toBe(TwitterBot);
  expect(Twitter.Profiler).toBe(TwitterProfiler);
  expect(Twitter.Configs).toMatchInlineSnapshot(`
    Object {
      "$$multi": false,
      "$$name": "TwitterConfigs",
      "$$polymorphic": false,
      "$$typeof": Symbol(interface.service.sociably),
    }
  `);
});

describe('initModule(configs)', () => {
  it('create module object', () => {
    const eventMiddlewares = [(ctx, next) => next(ctx)];
    const dispatchMiddlewares = [(ctx, next) => next(ctx)];

    const module = Twitter.initModule({
      ...basicConfigs,
      webhookPath: '/webhook/twitter',
      maxRequestConnections: 999,
      eventMiddlewares,
      dispatchMiddlewares,
    });

    expect(module.name).toBe('twitter');
    expect(module.utilitiesInterface).toMatchInlineSnapshot(`
      Object {
        "$$multi": false,
        "$$name": "TwitterPlatformUtilities",
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
      ...basicConfigs,
      webhookPath: '/webhook/twitter',
      maxRequestConnections: 999,
      eventMiddlewares: [(ctx, next) => next(ctx)],
    };

    const app = Sociably.createApp({
      platforms: [Twitter.initModule(configs)],
    });
    await app.start();

    const [bot, receiver, configsProvided, profiler, routings] =
      app.useServices([
        Twitter.Bot,
        Twitter.Receiver,
        Twitter.Configs,
        Twitter.Profiler,
        Http.RequestRouteList,
      ]);

    expect(bot).toBeInstanceOf(TwitterBot);
    expect(receiver).toBeInstanceOf(TwitterReceiver);
    expect(profiler).toBeInstanceOf(TwitterProfiler);
    expect(configsProvided).toEqual(configs);
    expect(routings).toEqual([
      {
        name: 'twitter',
        path: '/webhook/twitter',
        handler: expect.any(Function),
      },
    ]);
  });

  test('provide base interface', async () => {
    const app = Sociably.createApp({
      platforms: [Twitter.initModule(basicConfigs)],
    });
    await app.start();

    const [bots, profilers, marshalTypes]: any = app.useServices([
      BaseBot.PlatformMap,
      BaseProfiler.PlatformMap,
      BaseMarshaler.TypeList,
    ]);

    expect(bots.get('twitter')).toBeInstanceOf(TwitterBot);
    expect(profilers.get('twitter')).toBeInstanceOf(TwitterProfiler);
    expect(marshalTypes).toEqual(
      expect.arrayContaining([
        TwitterUser,
        TwitterChat,
        TweetTarget,
        TwitterUserProfile,
      ])
    );
  });

  test('default webhookPath to "/"', async () => {
    const app = Sociably.createApp({
      platforms: [Twitter.initModule(basicConfigs)],
    });
    await app.start();

    const [routings] = app.useServices([Http.RequestRouteList]);
    expect(routings).toEqual([
      { name: 'twitter', path: '/', handler: expect.any(Function) },
    ]);
  });

  describe('provide AgentSettingsAccessor interface', () => {
    test('with options.agentSettings', async () => {
      const app = Sociably.createApp({
        platforms: [
          Twitter.initModule({
            agentSettings: {
              userId: '1234567890',
              accessToken: '__ACCESS_TOKEN__',
              tokenSecret: '__ACCESS_SECRET__',
            },
            appKey: '__APP_KEY__',
            appSecret: '__APP_SECRET__',
            bearerToken: '__BEARER_TOKEN__',
          }),
        ],
      });
      await app.start();

      const [agentSettingsAccessor] = app.useServices([AgentSettingsAccessorI]);

      await expect(
        agentSettingsAccessor.getChannelSettings(new TwitterUser('1234567890'))
      ).resolves.toEqual({
        userId: '1234567890',
        accessToken: '__ACCESS_TOKEN__',
        tokenSecret: '__ACCESS_SECRET__',
      });
      await expect(
        agentSettingsAccessor.getChannelSettings(new TwitterUser('9876543210'))
      ).resolves.toBe(null);

      await expect(
        agentSettingsAccessor.getChannelSettingsBatch([
          new TwitterUser('1234567890'),
          new TwitterUser('9876543210'),
        ])
      ).resolves.toEqual([
        {
          userId: '1234567890',
          accessToken: '__ACCESS_TOKEN__',
          tokenSecret: '__ACCESS_SECRET__',
        },
        null,
      ]);

      await expect(
        agentSettingsAccessor.listAllChannelSettings('twitter')
      ).resolves.toEqual([
        {
          userId: '1234567890',
          accessToken: '__ACCESS_TOKEN__',
          tokenSecret: '__ACCESS_SECRET__',
        },
      ]);
    });

    test('with options.multiAgentSettings', async () => {
      const agent1 = new TwitterUser('1111111111');
      const agentSettings1 = {
        userId: '1111111111',
        accessToken: '_ACCESS_TOKEN_1_',
        tokenSecret: '_ACCESS_SECRET_1_',
      };

      const agent2 = new TwitterUser('2222222222');
      const agentSettings2 = {
        userId: '2222222222',
        accessToken: '_ACCESS_TOKEN_2_',
        tokenSecret: '_ACCESS_SECRET_2_',
      };

      const app = Sociably.createApp({
        platforms: [
          Twitter.initModule({
            multiAgentSettings: [agentSettings1, agentSettings2],
            appKey: '__APP_KEY__',
            appSecret: '__APP_SECRET__',
            bearerToken: '__BEARER_TOKEN__',
          }),
        ],
      });
      await app.start();

      const [agentSettingsAccessor] = app.useServices([AgentSettingsAccessorI]);

      await expect(
        agentSettingsAccessor.getChannelSettings(agent1)
      ).resolves.toEqual(agentSettings1);
      await expect(
        agentSettingsAccessor.getChannelSettings(agent2)
      ).resolves.toEqual(agentSettings2);
      await expect(
        agentSettingsAccessor.getChannelSettings(new TwitterUser('3333333333'))
      ).resolves.toBe(null);

      await expect(
        agentSettingsAccessor.getChannelSettingsBatch([
          agent1,
          agent2,
          new TwitterUser('3333333333'),
        ])
      ).resolves.toEqual([agentSettings1, agentSettings2, null]);

      await expect(
        agentSettingsAccessor.listAllChannelSettings('twitter')
      ).resolves.toEqual([agentSettings1, agentSettings2]);
    });

    test('with options.agentSettings', async () => {
      const MyAgentSettingsServiceI = makeInterface({
        name: 'MyAgentSettingsService',
      });
      const mySettingsAccessor = {
        getChannelSettings: async () => null,
        getChannelSettingsBatch: async () => [],
        listAllChannelSettings: async () => [],
      };

      const app = Sociably.createApp({
        platforms: [
          Twitter.initModule({
            agentSettingsService: MyAgentSettingsServiceI,
            appKey: '__APP_KEY__',
            appSecret: '__APP_SECRET__',
            bearerToken: '__BEARER_TOKEN__',
          }),
        ],
        services: [
          {
            provide: MyAgentSettingsServiceI,
            withValue: mySettingsAccessor,
          },
        ],
      });
      await app.start();

      const [agentSettingsAccessor] = app.useServices([AgentSettingsAccessorI]);
      expect(agentSettingsAccessor).toBe(mySettingsAccessor);
    });
  });

  test('.startHook() start bot', async () => {
    const bot = moxy({ start: async () => {} });
    const module = Twitter.initModule(basicConfigs);

    const startHook = module.startHook as any;
    await expect(startHook(bot)).resolves.toBe(undefined);
    expect(bot.start).toHaveBeenCalledTimes(1);
  });

  test('.stopHook() stop bot', async () => {
    const bot = moxy({ stop: async () => {} });
    const module = Twitter.initModule(basicConfigs);

    const stopHook = module.stopHook as any;
    await expect(stopHook(bot)).resolves.toBe(undefined);
    expect(bot.stop).toHaveBeenCalledTimes(1);
  });
});
