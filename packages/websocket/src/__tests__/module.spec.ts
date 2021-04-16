import moxy from '@moxyjs/moxy';
import Machinat from '@machinat/core';
import BaseBot from '@machinat/core/base/Bot';
import BaseMarshaler from '@machinat/core/base/Marshaler';
import Http from '@machinat/http';
import {
  WebSocketConnection,
  WebSocketUserChannel,
  WebSocketTopicChannel,
} from '../channel';
import { WebSocketServer } from '../server';
import { WebSocketReceiver } from '../receiver';
import { WebSocketBot } from '../bot';
import WebSocket from '../module';

it('export interfaces', () => {
  expect(WebSocket.Bot).toBe(WebSocketBot);
  expect(WebSocket.Receiver).toBe(WebSocketReceiver);
  expect(WebSocket.Server).toBe(WebSocketServer);
  expect(WebSocket.Configs).toMatchInlineSnapshot(`
    Object {
      "$$multi": false,
      "$$name": "WebSocketConfigs",
      "$$polymorphic": false,
      "$$typeof": Symbol(interface.service.machinat),
    }
  `);
  expect(WebSocket.LoginVerifier).toMatchInlineSnapshot(`
    Object {
      "$$multi": false,
      "$$name": "WebSocketLoginVerifier",
      "$$polymorphic": false,
      "$$typeof": Symbol(interface.service.machinat),
    }
  `);
  expect(WebSocket.UpgradeVerifier).toMatchInlineSnapshot(`
    Object {
      "$$multi": false,
      "$$name": "WebSocketUpgradeVerifier",
      "$$polymorphic": false,
      "$$typeof": Symbol(interface.service.machinat),
    }
  `);
  expect(WebSocket.ServerId).toMatchInlineSnapshot(`
    Object {
      "$$multi": false,
      "$$name": "WebSocketServerId",
      "$$polymorphic": false,
      "$$typeof": Symbol(interface.service.machinat),
    }
  `);
  expect(WebSocket.WsServer).toMatchInlineSnapshot(`
    Object {
      "$$multi": false,
      "$$name": "WebSocketWsServer",
      "$$polymorphic": false,
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

    expect(module.name).toBe('websocket');
    expect(module.utilitiesInterface).toMatchInlineSnapshot(`
      Object {
        "$$multi": false,
        "$$name": "WebSocketPlatformUtilities",
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
    const app = Machinat.createApp({
      platforms: [
        WebSocket.initModule({
          entryPath: '/my_web_socket_server',
          heartbeatInterval: 999,
        }),
      ],
    });
    await app.start();

    const [bot, receiver, server, configs, upgradeRoutings] = app.useServices([
      WebSocket.Bot,
      WebSocket.Receiver,
      WebSocket.Server,
      WebSocket.Configs,
      Http.UpgradeRouteList,
    ]);

    expect(bot).toBeInstanceOf(WebSocketBot);
    expect(receiver).toBeInstanceOf(WebSocketReceiver);
    expect(server).toBeInstanceOf(WebSocketServer);
    expect(configs).toEqual({
      entryPath: '/my_web_socket_server',
      heartbeatInterval: 999,
    });
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

    const [upgradeRoutings] = app.useServices([Http.UpgradeRouteList]);
    expect(upgradeRoutings).toEqual([
      {
        name: 'websocket',
        path: '/',
        handler: expect.any(Function),
      },
    ]);
  });

  test('provide base interface', async () => {
    const app = Machinat.createApp({
      platforms: [WebSocket.initModule({})],
    });
    await app.start();

    const [bots, marshalTypes] = app.useServices([
      BaseBot.PlatformMap,
      BaseMarshaler.TypeList,
    ]);

    expect(bots.get('websocket')).toBeInstanceOf(WebSocketBot);
    expect(marshalTypes).toEqual(
      expect.arrayContaining([
        WebSocketConnection,
        WebSocketUserChannel,
        WebSocketTopicChannel,
      ])
    );
  });

  test('startHook() calls bot.start()', async () => {
    const fakeBot = moxy({ start: async () => {} });

    const app = Machinat.createApp({
      platforms: [WebSocket.initModule()],
      services: [{ provide: WebSocket.Bot, withValue: fakeBot }],
    });
    await app.start();

    expect(fakeBot.start.mock).toHaveBeenCalledTimes(1);
  });

  test('stopHook() calls bot.stop()', async () => {
    const fakeBot = moxy({ start: async () => {}, stop: async () => {} });

    const app = Machinat.createApp({
      platforms: [WebSocket.initModule()],
      services: [{ provide: WebSocket.Bot, withValue: fakeBot }],
    });
    await app.start();
    expect(fakeBot.stop.mock).not.toHaveBeenCalled();

    await app.stop();
    expect(fakeBot.stop.mock).toHaveBeenCalledTimes(1);
  });
});
