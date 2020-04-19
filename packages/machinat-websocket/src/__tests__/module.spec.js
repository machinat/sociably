import moxy from 'moxy';
import Machinat from '@machinat/core';
import HTTP from '@machinat/http';
import Transmitter from '../transmitter';
import WebSocketReceiver from '../receiver';
import WebSocketBot from '../bot';
import WebSocket from '..';

it('export interfaces', () => {
  expect(WebSocket.Bot).toBe(WebSocketBot);
  expect(WebSocket.Receiver).toBe(WebSocketReceiver);
  expect(WebSocket.Transmitter).toBe(Transmitter);
  expect(WebSocket.SIGN_IN_VERIFIER_I).toMatchInlineSnapshot(`
    Object {
      "$$multi": false,
      "$$name": "WebSocketSignInVerifier",
      "$$typeof": Symbol(machinat.services.interface),
    }
  `);
  expect(WebSocket.UPGRADE_VERIFIER_I).toMatchInlineSnapshot(`
    Object {
      "$$multi": false,
      "$$name": "WebSocketUpgradeVerifier",
      "$$typeof": Symbol(machinat.services.interface),
    }
  `);
  expect(WebSocket.SERVER_ID_I).toMatchInlineSnapshot(`
    Object {
      "$$multi": false,
      "$$name": "WebSocketServerId",
      "$$typeof": Symbol(machinat.services.interface),
    }
  `);
});

describe('initModule()', () => {
  test('module object', () => {
    const eventMiddlewares = [moxy((ctx, next) => next(ctx))];
    const dispatchMiddlewares = [moxy((ctx, next) => next(ctx))];

    expect(
      WebSocket.initModule({ eventMiddlewares, dispatchMiddlewares })
    ).toEqual({
      name: 'websocket',
      mounterInterface: {
        $$multi: false,
        $$name: 'WebSocketPlatformMounter',
        $$typeof: expect.anything(),
      },
      provisions: expect.any(Array),
      startHook: expect.any(Function),
      eventMiddlewares,
      dispatchMiddlewares,
    });
  });

  test('provisions', async () => {
    const app = Machinat.createApp({
      platforms: [WebSocket.initModule({ entryPath: '/my_web_socket_server' })],
    });
    await app.start();

    const [
      bot,
      receiver,
      transmitter,
      configs,
      serverId,
      upgradeRoutings,
    ] = app.useServices([
      WebSocket.Bot,
      WebSocket.Receiver,
      WebSocket.Transmitter,
      WebSocket.CONFIGS_I,
      WebSocket.SERVER_ID_I,
      HTTP.UPGRADE_ROUTINGS_I,
    ]);

    expect(bot).toBeInstanceOf(WebSocketBot);
    expect(receiver).toBeInstanceOf(WebSocketReceiver);
    expect(transmitter).toBeInstanceOf(Transmitter);
    expect(configs).toEqual({ entryPath: '/my_web_socket_server' });
    expect(typeof serverId).toBe('string');
    expect(upgradeRoutings).toEqual([
      {
        name: 'websocket',
        path: '/my_web_socket_server',
        handler: expect.any(Function),
      },
    ]);
  });

  test('set default routing path to "/"', async () => {
    const app = Machinat.createApp({ platforms: [WebSocket.initModule()] });
    await app.start();

    const [upgradeRoutings] = app.useServices([HTTP.UPGRADE_ROUTINGS_I]);
    expect(upgradeRoutings).toEqual([
      {
        name: 'websocket',
        path: '/',
        handler: expect.any(Function),
      },
    ]);
  });

  test('startHook() calls bot.start()', async () => {
    const fakeBot = moxy({ start: async () => {} });

    const app = Machinat.createApp({
      platforms: [WebSocket.initModule()],
      registers: [{ provide: WebSocket.Bot, withValue: fakeBot }],
    });
    await app.start();

    expect(fakeBot.start.mock).toHaveBeenCalledTimes(1);
  });
});
