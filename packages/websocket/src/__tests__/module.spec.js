import moxy from '@moxyjs/moxy';
import Machinat from '@machinat/core';
import HTTP from '@machinat/http';
import { WebSocketTransmitter } from '../transmitter';
import { WebSocketReceiver } from '../receiver';
import { WebSocketBot } from '../bot';
import WebSocket from '../module';

it('export interfaces', () => {
  expect(WebSocket.Bot).toBe(WebSocketBot);
  expect(WebSocket.Receiver).toBe(WebSocketReceiver);
  expect(WebSocket.Transmitter).toBe(WebSocketTransmitter);
  expect(WebSocket.LOGIN_VERIFIER_I).toMatchInlineSnapshot(`
    Object {
      "$$branched": false,
      "$$multi": false,
      "$$name": "WebSocketLoginVerifierI",
      "$$typeof": Symbol(interface.service.machinat),
    }
  `);
  expect(WebSocket.UPGRADE_VERIFIER_I).toMatchInlineSnapshot(`
    Object {
      "$$branched": false,
      "$$multi": false,
      "$$name": "WebSocketUpgradeVerifierI",
      "$$typeof": Symbol(interface.service.machinat),
    }
  `);
  expect(WebSocket.SERVER_ID_I).toMatchInlineSnapshot(`
    Object {
      "$$branched": false,
      "$$multi": false,
      "$$name": "WebSocketServerIdI",
      "$$typeof": Symbol(interface.service.machinat),
    }
  `);
});

describe('initModule()', () => {
  test('module object', () => {
    const eventMiddlewares = [moxy((ctx, next) => next(ctx))];
    const dispatchMiddlewares = [moxy((ctx, next) => next(ctx))];

    const module = WebSocket.initModule({
      eventMiddlewares,
      dispatchMiddlewares,
    });

    expect(module.name).toBe('web_socket');
    expect(module.mounterInterface).toMatchInlineSnapshot(`
      Object {
        "$$branched": false,
        "$$multi": false,
        "$$name": "WebSocketPlatformMounterI",
        "$$typeof": Symbol(interface.service.machinat),
      }
    `);
    expect(module.provisions).toBeInstanceOf(Array);
    expect(typeof module.startHook).toBe('function');
    expect(module.eventMiddlewares).toEqual(eventMiddlewares);
    expect(module.dispatchMiddlewares).toEqual(dispatchMiddlewares);
  });

  test('provisions', async () => {
    const verifyLogin = moxy();
    const verifyUpgrade = moxy();

    const app = Machinat.createApp({
      platforms: [
        WebSocket.initModule({
          entryPath: '/my_web_socket_server',
          heartbeatInterval: 999,
          verifyLogin,
          verifyUpgrade,
        }),
      ],
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
    expect(transmitter).toBeInstanceOf(WebSocketTransmitter);
    expect(configs).toEqual({
      entryPath: '/my_web_socket_server',
      heartbeatInterval: 999,
      verifyLogin,
      verifyUpgrade,
    });
    expect(typeof serverId).toBe('string');
    expect(upgradeRoutings).toEqual([
      {
        name: 'web_socket',
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
        name: 'web_socket',
        path: '/',
        handler: expect.any(Function),
      },
    ]);
  });

  test('startHook() calls bot.start()', async () => {
    const fakeBot = moxy({ start: async () => {} });

    const app = Machinat.createApp({
      platforms: [WebSocket.initModule()],
      bindings: [{ provide: WebSocket.Bot, withValue: fakeBot }],
    });
    await app.start();

    expect(fakeBot.start.mock).toHaveBeenCalledTimes(1);
  });
});
