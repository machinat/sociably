import moxy from '@moxyjs/moxy';
import Machinat from '@machinat/core';
import BaseBot from '@machinat/core/base/Bot';
import BaseProfiler from '@machinat/core/base/Profiler';
import BaseMarshaler from '@machinat/core/base/Marshaler';
import Http from '@machinat/http';
import Messenger from '../module';
import MessengerChat from '../Chat';
import MessengerUser from '../User';
import MessengerUserProfile from '../UserProfile';
import { MessengerProfiler } from '../Profiler';

import { MessengerReceiver } from '../Receiver';
import { MessengerBot } from '../Bot';

it('export interfaces', () => {
  expect(Messenger.Receiver).toBe(MessengerReceiver);
  expect(Messenger.Bot).toBe(MessengerBot);
  expect(Messenger.Profiler).toBe(MessengerProfiler);
  expect(Messenger.Configs).toMatchInlineSnapshot(`
    Object {
      "$$multi": false,
      "$$name": "MessengerConfigs",
      "$$polymorphic": false,
      "$$typeof": Symbol(interface.service.machinat),
    }
  `);
});

describe('initModule(configs)', () => {
  it('create module object', () => {
    const eventMiddlewares = [(ctx, next) => next(ctx)];
    const dispatchMiddlewares = [(ctx, next) => next(ctx)];

    const module = Messenger.initModule({
      pageId: '1234567890',
      accessToken: '_ACCESS_TOKEN_',
      appSecret: '_APP_SECRET_',
      verifyToken: '_VERIFY_TOKEN_',
      eventMiddlewares,
      dispatchMiddlewares,
    });

    expect(module.name).toBe('messenger');
    expect(module.utilitiesInterface).toMatchInlineSnapshot(`
      Object {
        "$$multi": false,
        "$$name": "MessengerPlatformUtilities",
        "$$polymorphic": false,
        "$$typeof": Symbol(interface.service.machinat),
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
      webhookPath: '/webhook/messenger',
      eventMiddlewares: [(ctx, next) => next(ctx)],
    };

    const app = Machinat.createApp({
      platforms: [Messenger.initModule(configs)],
    });
    await app.start();

    const [bot, receiver, profiler, configsProvided, routings] =
      app.useServices([
        Messenger.Bot,
        Messenger.Receiver,
        Messenger.Profiler,
        Messenger.Configs,
        Http.RequestRouteList,
      ]);

    expect(bot).toBeInstanceOf(MessengerBot);
    expect(receiver).toBeInstanceOf(MessengerReceiver);
    expect(profiler).toBeInstanceOf(MessengerProfiler);
    expect(configsProvided).toEqual(configs);
    expect(routings).toEqual([
      {
        name: 'messenger',
        path: '/webhook/messenger',
        handler: expect.any(Function),
      },
    ]);

    bot.stop();
  });

  test('provide base interfaces', async () => {
    const app = Machinat.createApp({
      platforms: [
        Messenger.initModule({
          pageId: '1234567890',
          accessToken: '_ACCESS_TOKEN_',
          appSecret: '_APP_SECRET_',
          verifyToken: '_VERIFY_TOKEN_',
        }),
      ],
    });
    await app.start();

    const [bot, bots, profilers, marshalTypes] = app.useServices([
      Messenger.Bot,
      BaseBot.PlatformMap,
      BaseProfiler.PlatformMap,
      BaseMarshaler.TypeList,
    ]);

    expect(bot).toBeInstanceOf(MessengerBot);
    expect(bots.get('messenger')).toBe(bot);
    expect(profilers.get('messenger')).toBeInstanceOf(MessengerProfiler);
    expect(marshalTypes).toEqual(
      expect.arrayContaining([
        MessengerChat,
        MessengerUser,
        MessengerUserProfile,
      ])
    );

    bot.stop();
  });

  test('default webhookPath to "/"', async () => {
    const app = Machinat.createApp({
      platforms: [
        Messenger.initModule({
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
      { name: 'messenger', path: '/', handler: expect.any(Function) },
    ]);

    app.useServices([Messenger.Bot])[0].stop();
  });

  test('#startHook() start bot', async () => {
    const bot = moxy({ start: async () => {} });
    const module = Messenger.initModule({
      pageId: '1234567890',
      accessToken: '_ACCESS_TOKEN_',
    });

    await expect((module.startHook as any)(bot)).resolves.toBe(undefined);
    expect(bot.start.mock).toHaveBeenCalledTimes(1);
  });

  test('#stopHook() stop bot', async () => {
    const bot = moxy({ stop: async () => {} });
    const module = Messenger.initModule({
      pageId: '1234567890',
      accessToken: '_ACCESS_TOKEN_',
    });

    await expect((module.stopHook as any)(bot)).resolves.toBe(undefined);
    expect(bot.stop.mock).toHaveBeenCalledTimes(1);
  });
});
