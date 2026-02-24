import moxy from '@moxyjs/moxy';
import Sociably from '@sociably/core';
import BaseSender from '@sociably/core/base/Sender.js';
import BaseMarshaler from '@sociably/core/base/Marshaler.js';
import Http from '@sociably/http';
import WebSocketConnection from '../Connection.js';
import { WebSocketServer } from '../Server.js';
import { WebSocketReceiver } from '../Receiver.js';
import { WebSocketSender } from '../Sender.js';
import WebSocket from '../module.js';

it('export interfaces', () => {
  expect(WebSocket.Sender).toBe(WebSocketSender);
  expect(WebSocket.Receiver).toBe(WebSocketReceiver);
  expect(WebSocket.Server).toBe(WebSocketServer);
  expect(WebSocket.Configs).toMatchInlineSnapshot(`
    {
      "$$multi": false,
      "$$name": "WebSocketConfigs",
      "$$polymorphic": false,
      "$$typeof": Symbol(interface.service.sociably),
    }
  `);
  expect(WebSocket.LoginVerifier).toMatchInlineSnapshot(`
    {
      "$$multi": false,
      "$$name": "WebSocketLoginVerifier",
      "$$polymorphic": false,
      "$$typeof": Symbol(interface.service.sociably),
    }
  `);
  expect(WebSocket.UpgradeVerifier).toMatchInlineSnapshot(`
    {
      "$$multi": false,
      "$$name": "WebSocketUpgradeVerifier",
      "$$polymorphic": false,
      "$$typeof": Symbol(interface.service.sociably),
    }
  `);
  expect(WebSocket.ServerId).toMatchInlineSnapshot(`
    {
      "$$multi": false,
      "$$name": "WebSocketServerId",
      "$$polymorphic": false,
      "$$typeof": Symbol(interface.service.sociably),
    }
  `);
  expect(WebSocket.WsServer).toMatchInlineSnapshot(`
    {
      "$$multi": false,
      "$$name": "WebSocketWsServer",
      "$$polymorphic": false,
      "$$typeof": Symbol(interface.service.sociably),
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

    expect(module.name).toBe('websocket');
    expect(module.utilitiesInterface).toMatchInlineSnapshot(`
      {
        "$$multi": false,
        "$$name": "WebSocketPlatformUtilities",
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
    const app = Sociably.createApp({
      platforms: [
        WebSocket.initModule({
          entryPath: 'my_web_socket_server',
          heartbeatInterval: 999,
        }),
      ],
    });
    await app.start();

    const [sender, receiver, server, configs, upgradeRoutings] =
      app.useServices([
        WebSocket.Sender,
        WebSocket.Receiver,
        WebSocket.Server,
        WebSocket.Configs,
        Http.UpgradeRouteList,
      ]);

    expect(sender).toBeInstanceOf(WebSocketSender);
    expect(receiver).toBeInstanceOf(WebSocketReceiver);
    expect(server).toBeInstanceOf(WebSocketServer);
    expect(configs).toEqual({
      entryPath: 'my_web_socket_server',
      heartbeatInterval: 999,
    });
    expect(upgradeRoutings).toEqual([
      {
        name: 'websocket',
        path: 'my_web_socket_server',
        handler: expect.any(Function),
      },
    ]);
  });

  test('set default routing path to "/"', async () => {
    const app = Sociably.createApp({ platforms: [WebSocket.initModule()] });
    await app.start();

    const [upgradeRoutings] = app.useServices([Http.UpgradeRouteList]);
    expect(upgradeRoutings).toEqual([
      {
        name: 'websocket',
        path: '.',
        handler: expect.any(Function),
      },
    ]);
  });

  test('provide base interface', async () => {
    const app = Sociably.createApp({
      platforms: [WebSocket.initModule({})],
    });
    await app.start();

    const [bots, marshalTypes] = app.useServices([
      BaseSender.PlatformMap,
      BaseMarshaler.TypeList,
    ]);

    expect(bots.get('websocket')).toBeInstanceOf(WebSocketSender);
    expect(marshalTypes).toEqual(expect.arrayContaining([WebSocketConnection]));
  });

  test('startHook() calls sender.start()', async () => {
    const fakeSender = moxy({ start: async () => {} });

    const app = Sociably.createApp({
      platforms: [WebSocket.initModule()],
      services: [{ provide: WebSocket.Sender, withValue: fakeSender }],
    });
    await app.start();

    expect(fakeSender.start).toHaveBeenCalledTimes(1);
  });

  test('stopHook() calls sender.stop()', async () => {
    const fakeSender = moxy({ start: async () => {}, stop: async () => {} });

    const app = Sociably.createApp({
      platforms: [WebSocket.initModule()],
      services: [{ provide: WebSocket.Sender, withValue: fakeSender }],
    });
    await app.start();
    expect(fakeSender.stop).not.toHaveBeenCalled();

    await app.stop();
    expect(fakeSender.stop).toHaveBeenCalledTimes(1);
  });
});
