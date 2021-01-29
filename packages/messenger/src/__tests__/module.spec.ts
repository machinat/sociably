import moxy from '@moxyjs/moxy';
import Machinat from '@machinat/core';
import Base from '@machinat/core/base';
import Http from '@machinat/http';
import Messenger from '../module';
import MessengerChat from '../channel';
import MessengerUser from '../user';
import { MessengerUserProfile, MessengerProfiler } from '../profiler';
import { MessengerReceiver } from '../receiver';
import { MessengerBot } from '../bot';

it('export interfaces', () => {
  expect(Messenger.Receiver).toBe(MessengerReceiver);
  expect(Messenger.Bot).toBe(MessengerBot);
  expect(Messenger.Profiler).toBe(MessengerProfiler);
  expect(Messenger.ConfigsI).toMatchInlineSnapshot(`
    Object {
      "$$multi": false,
      "$$name": "MessengerConfigsI",
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
      pageId: '_PAGE_ID_',
      accessToken: '_ACCESS_TOKEN_',
      appSecret: '_APP_SECRET_',
      verifyToken: '_VERIFY_TOKEN_',
      eventMiddlewares,
      dispatchMiddlewares,
    });

    expect(module.name).toBe('messenger');
    expect(module.mounterInterface).toMatchInlineSnapshot(`
      Object {
        "$$multi": false,
        "$$name": "MessengerPlatformMounterI",
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
      pageId: '_PAGE_ID_',
      accessToken: '_ACCESS_TOKEN_',
      appSecret: '_APP_SECRET_',
      verifyToken: '_VERIFY_TOKEN_',
      entryPath: '/webhook/messenger',
      eventMiddlewares: [(ctx, next) => next(ctx)],
    };

    const app = Machinat.createApp({
      platforms: [Messenger.initModule(configs)],
    });
    await app.start();

    const [
      bot,
      receiver,
      profiler,
      configsProvided,
      routings,
    ] = app.useServices([
      Messenger.Bot,
      Messenger.Receiver,
      Messenger.Profiler,
      Messenger.ConfigsI,
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

  test('provisions when noServer', async () => {
    const configs = {
      noServer: true,
      pageId: '_PAGE_ID_',
      accessToken: '_ACCESS_TOKEN_',
      appSecret: '_APP_SECRET_',
    };

    const app = Machinat.createApp({
      platforms: [Messenger.initModule(configs)],
    });
    await app.start();

    const [bot, profiler, configsProvided, routings] = app.useServices([
      Messenger.Bot,
      Messenger.Profiler,
      Messenger.ConfigsI,
      Http.RequestRouteList,
    ]);

    expect(bot).toBeInstanceOf(MessengerBot);
    expect(profiler).toBeInstanceOf(MessengerProfiler);
    expect(configsProvided).toEqual(configs);

    expect(routings).toEqual([]);

    expect(() => {
      app.useServices([Messenger.Receiver]);
    }).toThrowErrorMatchingInlineSnapshot(`"MessengerReceiver is not bound"`);

    bot.stop();
  });

  test('provide base interfaces', async () => {
    const app = Machinat.createApp({
      platforms: [
        Messenger.initModule({
          pageId: '_PAGE_ID_',
          accessToken: '_ACCESS_TOKEN_',
          appSecret: '_APP_SECRET_',
          verifyToken: '_VERIFY_TOKEN_',
        }),
      ],
    });
    await app.start();

    const [bot, bots, profilers, marshalTypes] = app.useServices([
      Messenger.Bot,
      Base.Bot.PlatformMap,
      Base.Profiler.PlatformMap,
      Base.Marshaler.TypeI,
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

  test('default entryPath to "/"', async () => {
    const app = Machinat.createApp({
      platforms: [
        Messenger.initModule({
          pageId: '_PAGE_ID_',
          accessToken: '_ACCESS_TOKEN_',
          shouldHandleVerify: false,
          shouldValidateRequest: false,
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
      pageId: '_PAGE_ID_',
      accessToken: '_ACCESS_TOKEN_',
    });

    await expect((module.startHook as any)(bot)).resolves.toBe(undefined);
    expect(bot.start.mock).toHaveBeenCalledTimes(1);
  });
});
