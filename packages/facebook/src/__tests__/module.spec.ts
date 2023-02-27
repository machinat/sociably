import moxy from '@moxyjs/moxy';
import Sociably from '@sociably/core';
import BaseBot from '@sociably/core/base/Bot';
import BaseProfiler from '@sociably/core/base/Profiler';
import BaseMarshaler from '@sociably/core/base/Marshaler';
import Http from '@sociably/http';
import Facebook from '../module';
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
      pageId: '1234567890',
      accessToken: '_ACCESS_TOKEN_',
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
      pageId: '1234567890',
      accessToken: '_ACCESS_TOKEN_',
      appSecret: '_APP_SECRET_',
      verifyToken: '_VERIFY_TOKEN_',
      webhookPath: '/webhook/facebook',
      eventMiddlewares: [(ctx, next) => next(ctx)],
    };

    const app = Sociably.createApp({
      platforms: [Facebook.initModule(configs)],
    });
    await app.start();

    const [bot, receiver, profiler, configsProvided, routings] =
      app.useServices([
        Facebook.Bot,
        Facebook.Receiver,
        Facebook.Profiler,
        Facebook.Configs,
        Http.RequestRouteList,
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

    bot.stop();
  });

  test('provide base interfaces', async () => {
    const app = Sociably.createApp({
      platforms: [
        Facebook.initModule({
          pageId: '1234567890',
          accessToken: '_ACCESS_TOKEN_',
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
      expect.arrayContaining([FacebookChat, FacebookUser, FacebookUserProfile])
    );

    bot.stop();
  });

  test('default webhookPath to "/"', async () => {
    const app = Sociably.createApp({
      platforms: [
        Facebook.initModule({
          pageId: '1234567890',
          accessToken: '_ACCESS_TOKEN_',
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

  test('#startHook() start bot', async () => {
    const bot = moxy({ start: async () => {} });
    const module = Facebook.initModule({
      pageId: '1234567890',
      accessToken: '_ACCESS_TOKEN_',
    });

    await expect((module.startHook as any)(bot)).resolves.toBe(undefined);
    expect(bot.start).toHaveBeenCalledTimes(1);
  });

  test('#stopHook() stop bot', async () => {
    const bot = moxy({ stop: async () => {} });
    const module = Facebook.initModule({
      pageId: '1234567890',
      accessToken: '_ACCESS_TOKEN_',
    });

    await expect((module.stopHook as any)(bot)).resolves.toBe(undefined);
    expect(bot.stop).toHaveBeenCalledTimes(1);
  });
});
