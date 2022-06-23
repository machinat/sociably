import moxy from '@moxyjs/moxy';
import Sociably from '@sociably/core';
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

const minimumConfigs = {
  appId: '123456',
  appKey: '__APP_KEY__',
  appSecret: '__APP_SECRET__',
  bearerToken: '__BEARER_TOKEN__',
  accessToken: '__ACCESS_TOKEN__',
  accessSecret: '__ACCESS_SECRET__',
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
      ...minimumConfigs,
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
      ...minimumConfigs,
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
      platforms: [Twitter.initModule(minimumConfigs)],
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
      platforms: [Twitter.initModule(minimumConfigs)],
    });
    await app.start();

    const [routings] = app.useServices([Http.RequestRouteList]);
    expect(routings).toEqual([
      { name: 'twitter', path: '/', handler: expect.any(Function) },
    ]);
  });

  test('.startHook() start bot', async () => {
    const bot = moxy({ start: async () => {} });
    const module = Twitter.initModule(minimumConfigs);

    const startHook = module.startHook as any;
    await expect(startHook(bot)).resolves.toBe(undefined);
    expect(bot.start.mock).toHaveBeenCalledTimes(1);
  });

  test('.stopHook() stop bot', async () => {
    const bot = moxy({ stop: async () => {} });
    const module = Twitter.initModule(minimumConfigs);

    const stopHook = module.stopHook as any;
    await expect(stopHook(bot)).resolves.toBe(undefined);
    expect(bot.stop.mock).toHaveBeenCalledTimes(1);
  });
});
