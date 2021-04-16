import moxy, { Moxy } from '@moxyjs/moxy';
import _createNextServer from 'next';
import Machinat from '@machinat/core';
import BaseBot from '@machinat/core/base/Bot';
import BaseMarshaler from '@machinat/core/base/Marshaler';
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
import NoneAuthorizer from '../noneAuthorizer';
import Webview from '../module';

const createNextServer = _createNextServer as Moxy<typeof _createNextServer>;

it('export interfaces', () => {
  expect(Webview.Configs).toMatchInlineSnapshot(`
    Object {
      "$$multi": false,
      "$$name": "WebviewConfigs",
      "$$polymorphic": false,
      "$$typeof": Symbol(interface.service.machinat),
    }
  `);

  expect(Webview.Bot).toBe(WebviewBot);
  expect(Webview.Receiver).toBe(WebviewReceiver);
  expect(Object.getPrototypeOf(Webview.SocketServer)).toBe(WebSocket.Server);
  expect(Webview.SocketBroker).toMatchInlineSnapshot(`
    Object {
      "$$multi": false,
      "$$name": "WebviewSocketBroker",
      "$$polymorphic": false,
      "$$typeof": Symbol(interface.service.machinat),
    }
  `);
  expect(Webview.SocketServerId).toMatchInlineSnapshot(`
    Object {
      "$$multi": false,
      "$$name": "WebviewSocketServerId",
      "$$polymorphic": false,
      "$$typeof": Symbol(interface.service.machinat),
    }
  `);
  expect(Webview.WsServer).toMatchInlineSnapshot(`
    Object {
      "$$multi": false,
      "$$name": "WebviewWsServer",
      "$$polymorphic": false,
      "$$typeof": Symbol(interface.service.machinat),
    }
  `);

  expect(Object.getPrototypeOf(Webview.AuthController)).toBe(Auth.Controller);
  expect(Webview.AuthorizerList).toMatchInlineSnapshot(`
    Object {
      "$$multi": true,
      "$$name": "WebviewAuthorizersList",
      "$$polymorphic": false,
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
  expect(module.utilitiesInterface).toMatchInlineSnapshot(`
    Object {
      "$$multi": false,
      "$$name": "WebviewPlatformUtilities",
      "$$polymorphic": false,
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
    services: [
      { provide: Webview.AuthorizerList, withProvider: NoneAuthorizer },
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
    requestRoutes,
    upgradeRoutes,
  ] = app.useServices([
    Webview.Configs,
    Webview.Bot,
    Webview.Receiver,
    Webview.SocketServer,
    Webview.AuthController,
    Webview.AuthorizerList,
    Webview.NextReceiver,
    Webview.NextServer,
    Http.RequestRouteList,
    Http.UpgradeRouteList,
  ]);

  expect(configs).toEqual(configsInput);
  expect(bot).toBeInstanceOf(WebviewBot);
  expect(receiver).toBeInstanceOf(WebviewReceiver);
  expect(server).toBeInstanceOf(WebSocket.Server);

  expect(authController).toBeInstanceOf(Auth.Controller);
  expect(authorizers).toEqual([expect.any(NoneAuthorizer)]);

  expect(nextReceiver).toBeInstanceOf(Next.Receiver);
  expect(createNextServer.mock).toHaveBeenCalledTimes(1);
  expect(nextServer).toBe(createNextServer.mock.calls[0].result);

  expect(requestRoutes).toEqual(
    expect.arrayContaining([
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
  expect(upgradeRoutes).toEqual(
    expect.arrayContaining([
      {
        name: 'websocket',
        path: '/mySocket',
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
    services: [
      { provide: Webview.AuthorizerList, withProvider: NoneAuthorizer },
    ],
  });
  await app.start();

  const [requestRoutes, upgradeRoutes] = app.useServices([
    Http.RequestRouteList,
    Http.UpgradeRouteList,
  ]);
  expect(requestRoutes).toEqual([
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
  expect(upgradeRoutes).toEqual([
    {
      name: 'websocket',
      path: '/websocket',
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
    services: [
      { provide: Webview.AuthorizerList, withProvider: NoneAuthorizer },
    ],
  });
  await app.start();

  const [bots, marshalTypes] = app.useServices([
    BaseBot.PlatformMap,
    BaseMarshaler.TypeList,
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
    services: [
      { provide: Webview.Bot, withValue: fakeBot },
      { provide: Webview.AuthorizerList, withProvider: NoneAuthorizer },
    ],
  });
  await app.start();

  expect(fakeBot.start.mock).toHaveBeenCalledTimes(1);

  const nextServer = createNextServer.mock.calls[0].result;
  expect(nextServer.prepare.mock).toHaveBeenCalledTimes(1);
});

test('stopHook', async () => {
  const fakeBot = moxy({ start: async () => {}, stop: async () => {} });

  const app = Machinat.createApp({
    platforms: [
      Webview.initModule({
        webviewHost: 'machinat.io',
        authSecret: '_SECRET_',
      }),
    ],
    services: [
      { provide: Webview.Bot, withValue: fakeBot },
      { provide: Webview.AuthorizerList, withProvider: NoneAuthorizer },
    ],
  });
  await app.start();
  expect(fakeBot.stop.mock).not.toHaveBeenCalled();

  await app.stop();
  expect(fakeBot.stop.mock).toHaveBeenCalledTimes(1);
});
