import moxy from 'moxy';
import Machinat from '@machinat/core';
import Base from '@machinat/core/base';
import HTTP from '@machinat/http';
import Messenger from '..';
import MessengerProfileFetcher from '../profile';
import MessengerReceiver from '../receiver';
import MessengerBot from '../bot';

it('export interfaces', () => {
  expect(Messenger.Receiver).toBe(MessengerReceiver);
  expect(Messenger.Bot).toBe(MessengerBot);
  expect(Messenger.ProfileFetcher).toBe(MessengerProfileFetcher);
  expect(Messenger.CONFIGS_I).toMatchInlineSnapshot(`
    Object {
      "$$multi": false,
      "$$name": "MessengerPlatformConfigs",
      "$$typeof": Symbol(machinat.services.interface),
    }
  `);
});

describe('initModule(configs)', () => {
  it('create module object', () => {
    const eventMiddlewares = [(ctx, next) => next(ctx)];
    const dispatchMiddlewares = [(ctx, next) => next(ctx)];
    expect(
      Messenger.initModule({
        pageId: '_PAGE_ID_',
        accessToken: '_ACCESS_TOKEN_',
        appSecret: '_APP_SECRET_',
        verifyToken: '_VERIFY_TOKEN_',
        eventMiddlewares,
        dispatchMiddlewares,
      })
    ).toEqual({
      name: 'messenger',
      mounterInterface: {
        $$multi: false,
        $$name: 'MessengerPlatformMounter',
        $$typeof: expect.anything(),
      },
      provisions: expect.any(Array),
      startHook: expect.any(Function),
      eventMiddlewares,
      dispatchMiddlewares,
    });
  });

  test('provisions', async () => {
    const configs = {
      pageId: '_PAGE_ID_',
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

    const [
      bot,
      receiver,
      profiler,
      configsProvided,
      routings,
    ] = app.useServices([
      Messenger.Bot,
      Messenger.Receiver,
      Messenger.ProfileFetcher,
      Messenger.CONFIGS_I,
      HTTP.REQUEST_ROUTINGS_I,
    ]);

    expect(bot).toBeInstanceOf(MessengerBot);
    expect(receiver).toBeInstanceOf(MessengerReceiver);
    expect(profiler).toBeInstanceOf(MessengerProfileFetcher);
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
          pageId: '_PAGE_ID_',
          accessToken: '_ACCESS_TOKEN_',
          appSecret: '_APP_SECRET_',
          verifyToken: '_VERIFY_TOKEN_',
        }),
      ],
    });
    await app.start();

    const [bot, profiler] = app.useServices([Base.BotI, Base.ProfileFetcherI], {
      platform: 'messenger',
    });

    expect(bot).toBeInstanceOf(MessengerBot);
    expect(profiler).toBeInstanceOf(MessengerProfileFetcher);

    bot.stop();
  });

  test('default webhookPath to "/"', async () => {
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

    const [routings] = app.useServices([HTTP.REQUEST_ROUTINGS_I]);
    expect(routings).toEqual([
      { name: 'messenger', path: '/', handler: expect.any(Function) },
    ]);

    app.useServices([MessengerBot])[0].stop();
  });

  test('#startHook() start bot', async () => {
    const bot = moxy({ start: async () => {} });
    const module = Messenger.initModule({
      /* ... */
    });

    await expect(module.startHook(bot)).resolves.toBe(undefined);
    expect(bot.start.mock).toHaveBeenCalledTimes(1);
  });
});
