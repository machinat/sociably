import moxy from '@moxyjs/moxy';
import Machinat from '@machinat/core';
import Base from '@machinat/core/base';
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
  expect(WebSocket.ConfigsI).toMatchInlineSnapshot(`
    Object {
      "$$multi": false,
      "$$name": "WebSocketConfigsI",
      "$$polymorphic": false,
      "$$typeof": Symbol(interface.service.machinat),
    }
  `);
  expect(WebSocket.LoginVerifierI).toMatchInlineSnapshot(`
    Object {
      "$$multi": false,
      "$$name": "WebSocketLoginVerifierI",
      "$$polymorphic": false,
      "$$typeof": Symbol(interface.service.machinat),
    }
  `);
  expect(WebSocket.UpgradeVerifierI).toMatchInlineSnapshot(`
    Object {
      "$$multi": false,
      "$$name": "WebSocketUpgradeVerifierI",
      "$$polymorphic": false,
      "$$typeof": Symbol(interface.service.machinat),
    }
  `);
  expect(WebSocket.ServerIdI).toMatchInlineSnapshot(`
    Object {
      "$$multi": false,
      "$$name": "WebSocketServerIdI",
      "$$polymorphic": false,
      "$$typeof": Symbol(interface.service.machinat),
    }
  `);
  expect(WebSocket.WsServerI).toMatchInlineSnapshot(`
    Object {
      "$$multi": false,
      "$$name": "WebSocketWsServerI",
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
    expect(module.mounterInterface).toMatchInlineSnapshot(`
      Object {
        "$$multi": false,
        "$$name": "WebSocketPlatformMounterI",
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
      WebSocket.ConfigsI,
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
      Base.Bot.PlatformMap,
      Base.Marshaler.TypeI,
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
      bindings: [{ provide: WebSocket.Bot, withValue: fakeBot }],
    });
    await app.start();

    expect(fakeBot.start.mock).toHaveBeenCalledTimes(1);
  });
});
