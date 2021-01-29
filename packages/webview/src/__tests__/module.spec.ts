import moxy, { Moxy } from '@moxyjs/moxy';
import _createNextServer from 'next';
import Machinat from '@machinat/core';
import Base from '@machinat/core/base';
import Auth from '@machinat/auth';
import Http from '@machinat/http';
import Next from '@machinat/next';
import WebSocket from '@machinat/websocket';
import { WebviewReceiver } from '../receiver';
import { WebviewBot } from '../bot';
import {
  WebviewConnection,
  WebviewUserChannel,
  WebviewTopicChannel,
} from '../channel';
import { NoneServerAuthorizer } from '../noneAuthorizer';
import Webview from '../module';

const createNextServer = _createNextServer as Moxy<typeof _createNextServer>;

it('export interfaces', () => {
  expect(Webview.ConfigsI).toMatchInlineSnapshot(`
    Object {
      "$$branched": false,
      "$$multi": false,
      "$$name": "WebviewConfigsI",
      "$$typeof": Symbol(interface.service.machinat),
    }
  `);

  expect(Webview.Bot).toBe(WebviewBot);
  expect(Webview.Receiver).toBe(WebviewReceiver);
  expect(Object.getPrototypeOf(Webview.SocketServer)).toBe(WebSocket.Server);
  expect(Webview.SocketBrokerI).toMatchInlineSnapshot(`
    Object {
      "$$branched": false,
      "$$multi": false,
      "$$name": "WebviewSocketBrokerI",
      "$$typeof": Symbol(interface.service.machinat),
    }
  `);
  expect(Webview.SocketServerIdI).toMatchInlineSnapshot(`
    Object {
      "$$branched": false,
      "$$multi": false,
      "$$name": "WebviewSocketServerIdI",
      "$$typeof": Symbol(interface.service.machinat),
    }
  `);
  expect(Webview.WsServerI).toMatchInlineSnapshot(`
    Object {
      "$$branched": false,
      "$$multi": false,
      "$$name": "WebviewWsServerI",
      "$$typeof": Symbol(interface.service.machinat),
    }
  `);

  expect(Object.getPrototypeOf(Webview.AuthController)).toBe(Auth.Controller);
  expect(Webview.AuthorizerList).toMatchInlineSnapshot(`
    Object {
      "$$branched": false,
      "$$multi": true,
      "$$name": "WebviewAuthorizersListI",
      "$$typeof": Symbol(interface.service.machinat),
    }
  `);

  expect(Object.getPrototypeOf(Webview.NextReceiver)).toBe(Next.Receiver);
  expect(Webview.NextReceiver).toMatchInlineSnapshot(`[Function]`);
});

test('module object', () => {
  const eventMiddlewares = [moxy((ctx, next) => next(ctx))];
  const dispatchMiddlewares = [moxy((ctx, next) => next(ctx))];

  const module = Webview.initModule({
    webviewHost: 'machinat.io',
    authSecret: '_SECRET_',
    eventMiddlewares,
    dispatchMiddlewares,
  });

  expect(module.name).toBe('webview');
  expect(module.mounterInterface).toMatchInlineSnapshot(`
      Object {
        "$$branched": false,
        "$$multi": false,
        "$$name": "WebviewPlatformMounterI",
        "$$typeof": Symbol(interface.service.machinat),
      }
    `);
  expect(module.provisions).toBeInstanceOf(Array);
  expect(typeof module.startHook).toBe('function');
  expect(module.eventMiddlewares).toEqual(eventMiddlewares);
  expect(module.dispatchMiddlewares).toEqual(dispatchMiddlewares);
});

test('service provisions', async () => {
  const configsInput = {
    webviewPath: '/myView',
    authApiPath: '/myAuth',
    webSocketPath: '/mySocket',
    webviewHost: 'machinat.io',
    authSecret: '_SECRET_',
  };

  const app = Machinat.createApp({
    platforms: [Webview.initModule(configsInput)],
    bindings: [
      { provide: Webview.AuthorizerList, withProvider: NoneServerAuthorizer },
    ],
  });
  await app.start();

  const [
    configs,
    bot,
    receiver,
    server,
    authController,
    authorizers,
    nextReceiver,
    nextServer,
    upgradeRoutes,
  ] = app.useServices([
    Webview.ConfigsI,
    Webview.Bot,
    Webview.Receiver,
    Webview.SocketServer,
    Webview.AuthController,
    Webview.AuthorizerList,
    Webview.NextReceiver,
    Webview.NextServerI,
    Http.UpgradeRouteList,
  ]);

  expect(configs).toEqual(configsInput);
  expect(bot).toBeInstanceOf(WebviewBot);
  expect(receiver).toBeInstanceOf(WebviewReceiver);
  expect(server).toBeInstanceOf(WebSocket.Server);

  expect(authController).toBeInstanceOf(Auth.Controller);
  expect(authorizers).toEqual([expect.any(NoneServerAuthorizer)]);

  expect(nextReceiver).toBeInstanceOf(Next.Receiver);
  expect(createNextServer.mock).toHaveBeenCalledTimes(1);
  expect(nextServer).toBe(createNextServer.mock.calls[0].result);

  expect(upgradeRoutes).toEqual(
    expect.arrayContaining([
      {
        name: 'websocket',
        path: '/mySocket',
        handler: expect.any(Function),
      },
      {
        name: 'auth',
        path: '/myAuth',
        handler: expect.any(Function),
      },
      {
        name: 'next',
        path: '/myView',
        handler: expect.any(Function),
      },
    ])
  );
});

test('default routing paths', async () => {
  const app = Machinat.createApp({
    platforms: [
      Webview.initModule({
        webviewHost: 'machinat.io',
        authSecret: '_SECRET_',
      }),
    ],
    bindings: [
      { provide: Webview.AuthorizerList, withProvider: NoneServerAuthorizer },
    ],
  });
  await app.start();

  const [upgradeRoutings] = app.useServices([Http.UpgradeRouteList]);
  expect(upgradeRoutings).toEqual([
    {
      name: 'websocket',
      path: '/websocket',
      handler: expect.any(Function),
    },
    {
      name: 'auth',
      path: '/auth',
      handler: expect.any(Function),
    },
    {
      name: 'next',
      default: true,
      handler: expect.any(Function),
    },
  ]);
});

test('provide base interfaces', async () => {
  const app = Machinat.createApp({
    platforms: [
      Webview.initModule({
        webviewHost: 'machinat.io',
        authSecret: '_SECRET_',
      }),
    ],
    bindings: [
      { provide: Webview.AuthorizerList, withProvider: NoneServerAuthorizer },
    ],
  });
  await app.start();

  const [bots, marshalTypes] = app.useServices([
    Base.Bot.PlatformMap,
    Base.Marshaler.TypeI,
  ]);

  expect(bots.get('webview')).toBeInstanceOf(WebviewBot);
  expect(marshalTypes).toEqual(
    expect.arrayContaining([
      WebviewConnection,
      WebviewUserChannel,
      WebviewTopicChannel,
    ])
  );
});

test('startHook', async () => {
  const fakeBot = moxy({ start: async () => {} });

  const app = Machinat.createApp({
    platforms: [
      Webview.initModule({
        webviewHost: 'machinat.io',
        authSecret: '_SECRET_',
      }),
    ],
    bindings: [
      { provide: Webview.Bot, withValue: fakeBot },
      { provide: Webview.AuthorizerList, withProvider: NoneServerAuthorizer },
    ],
  });
  await app.start();

  expect(fakeBot.start.mock).toHaveBeenCalledTimes(1);

  const nextServer = createNextServer.mock.calls[0].result;
  expect(nextServer.prepare.mock).toHaveBeenCalledTimes(1);
});
