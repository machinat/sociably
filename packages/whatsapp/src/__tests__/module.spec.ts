import moxy from '@moxyjs/moxy';
import Sociably from '@sociably/core';
import BaseBot from '@sociably/core/base/Bot';
import BaseProfiler from '@sociably/core/base/Profiler';
import BaseMarshaler from '@sociably/core/base/Marshaler';
import Http from '@sociably/http';
import WhatsApp from '../module';
import WhatsAppChat from '../Chat';
import WhatsAppUser from '../User';
import WhatsAppUserProfile from '../UserProfile';
import { WhatsAppProfiler } from '../Profiler';

import { WhatsAppReceiver } from '../Receiver';
import { WhatsAppBot } from '../Bot';

it('export interfaces', () => {
  expect(WhatsApp.Receiver).toBe(WhatsAppReceiver);
  expect(WhatsApp.Bot).toBe(WhatsAppBot);
  expect(WhatsApp.Profiler).toBe(WhatsAppProfiler);
  expect(WhatsApp.Configs).toMatchInlineSnapshot(`
    Object {
      "$$multi": false,
      "$$name": "WhatsAppConfigs",
      "$$polymorphic": false,
      "$$typeof": Symbol(interface.service.sociably),
    }
  `);
});

describe('initModule(configs)', () => {
  it('create module object', () => {
    const eventMiddlewares = [(ctx, next) => next(ctx)];
    const dispatchMiddlewares = [(ctx, next) => next(ctx)];

    const module = WhatsApp.initModule({
      businessId: '9999999999',
      businessNumber: '1234567890',
      accessToken: '_ACCESS_TOKEN_',
      appSecret: '_APP_SECRET_',
      verifyToken: '_VERIFY_TOKEN_',
      eventMiddlewares,
      dispatchMiddlewares,
    });

    expect(module.name).toBe('whatsapp');
    expect(module.utilitiesInterface).toMatchInlineSnapshot(`
      Object {
        "$$multi": false,
        "$$name": "WhatsAppPlatformUtilities",
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
      businessId: '9999999999',
      businessNumber: '1234567890',
      accessToken: '_ACCESS_TOKEN_',
      appSecret: '_APP_SECRET_',
      verifyToken: '_VERIFY_TOKEN_',
      webhookPath: '/webhook/whatsapp',
      eventMiddlewares: [(ctx, next) => next(ctx)],
    };

    const app = Sociably.createApp({
      platforms: [WhatsApp.initModule(configs)],
    });
    await app.start();

    const [bot, receiver, profiler, configsProvided, routings] =
      app.useServices([
        WhatsApp.Bot,
        WhatsApp.Receiver,
        WhatsApp.Profiler,
        WhatsApp.Configs,
        Http.RequestRouteList,
      ]);

    expect(bot).toBeInstanceOf(WhatsAppBot);
    expect(receiver).toBeInstanceOf(WhatsAppReceiver);
    expect(profiler).toBeInstanceOf(WhatsAppProfiler);
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
      platforms: [
        WhatsApp.initModule({
          businessId: '9999999999',
          businessNumber: '1234567890',
          accessToken: '_ACCESS_TOKEN_',
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
      expect.arrayContaining([WhatsAppChat, WhatsAppUser, WhatsAppUserProfile])
    );

    bot.stop();
  });

  test('default webhookPath to "/"', async () => {
    const app = Sociably.createApp({
      platforms: [
        WhatsApp.initModule({
          businessId: '9999999999',
          businessNumber: '1234567890',
          accessToken: '_ACCESS_TOKEN_',
          shouldHandleChallenge: false,
          shouldVerifyRequest: false,
        }),
      ],
    });
    await app.start();

    const [routings] = app.useServices([Http.RequestRouteList]);
    expect(routings).toEqual([
      { name: 'whatsapp', path: '/', handler: expect.any(Function) },
    ]);

    app.useServices([WhatsApp.Bot])[0].stop();
  });

  test('#startHook() start bot', async () => {
    const bot = moxy({ start: async () => {} });
    const module = WhatsApp.initModule({
      businessId: '9999999999',
      businessNumber: '1234567890',
      accessToken: '_ACCESS_TOKEN_',
    });

    await expect((module.startHook as any)(bot)).resolves.toBe(undefined);
    expect(bot.start.mock).toHaveBeenCalledTimes(1);
  });

  test('#stopHook() stop bot', async () => {
    const bot = moxy({ stop: async () => {} });
    const module = WhatsApp.initModule({
      businessId: '9999999999',
      businessNumber: '1234567890',
      accessToken: '_ACCESS_TOKEN_',
    });

    await expect((module.stopHook as any)(bot)).resolves.toBe(undefined);
    expect(bot.stop.mock).toHaveBeenCalledTimes(1);
  });
});
