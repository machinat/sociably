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
import NoneAuthenticator from '../noneAuthenticator';
import Webview from '../module';

const createNextServer = _createNextServer as Moxy<typeof _createNextServer>;

beforeEach(() => {
  createNextServer.mock.reset();
});

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
  expect(Webview.AuthenticatorList).toMatchInlineSnapshot(`
    Object {
      "$$multi": true,
      "$$name": "WebviewAuthenticatorsList",
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
    authPlatforms: [NoneAuthenticator],
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
    authPlatforms: [NoneAuthenticator],
    webviewPath: '/myView',
    authApiPath: '/myAuth',
    webSocketPath: '/mySocket',
    webviewHost: 'machinat.io',
    authSecret: '_SECRET_',
    nextServerOptions: { dev: true, conf: { dist: '../../' } },
  };

  const app = Machinat.createApp({
    platforms: [Webview.initModule(configsInput)],
  });
  await app.start();

  const [
    configs,
    bot,
    receiver,
    server,
    authController,
    authenticators,
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
    Webview.AuthenticatorList,
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
  expect(authenticators).toEqual([expect.any(NoneAuthenticator)]);

  expect(nextReceiver).toBeInstanceOf(Next.Receiver);
  expect(createNextServer.mock).toHaveBeenCalledTimes(1);
  expect(createNextServer.mock).toHaveBeenCalledWith(
    configsInput.nextServerOptions
  );
  expect(nextServer).toBe(createNextServer.mock.calls[0].result);

  expect(requestRoutes).toEqual(
    expect.arrayContaining([
      { name: 'auth', path: '/myAuth', handler: expect.any(Function) },
      { name: 'next', path: '/myView', handler: expect.any(Function) },
    ])
  );
  expect(upgradeRoutes).toEqual([
    { name: 'websocket', path: '/mySocket', handler: expect.any(Function) },
  ]);
  await app.stop();
});

test('with noNextServer option', async () => {
  const configsInput = {
    authPlatforms: [NoneAuthenticator],
    webviewPath: '/myView',
    authApiPath: '/myAuth',
    webSocketPath: '/mySocket',
    webviewHost: 'machinat.io',
    authSecret: '_SECRET_',
    noNextServer: true,
  };
  const app = Machinat.createApp({
    platforms: [Webview.initModule(configsInput)],
  });
  await app.start();

  const [, , , , , , nextReceiver, nextServer, requestRoutes] = app.useServices(
    [
      Webview.Configs,
      Webview.Bot,
      Webview.Receiver,
      Webview.SocketServer,
      Webview.AuthController,
      Webview.AuthenticatorList,
      { require: Webview.NextReceiver, optional: true },
      { require: Webview.NextServer, optional: true },
      Http.RequestRouteList,
      Http.UpgradeRouteList,
    ]
  );

  expect(nextReceiver).toBe(null);
  expect(nextServer).toBe(null);
  expect(createNextServer.mock).not.toHaveBeenCalled();

  expect(requestRoutes).toEqual([
    { name: 'auth', path: '/myAuth', handler: expect.any(Function) },
  ]);
  await app.stop();
});

test('default routing paths', async () => {
  const app = Machinat.createApp({
    platforms: [
      Webview.initModule({
        authPlatforms: [NoneAuthenticator],
        webviewHost: 'machinat.io',
        authSecret: '_SECRET_',
      }),
    ],
    services: [
      { provide: Webview.AuthenticatorList, withProvider: NoneAuthenticator },
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
  await app.stop();
});

test('provide base interfaces', async () => {
  const app = Machinat.createApp({
    platforms: [
      Webview.initModule({
        authPlatforms: [NoneAuthenticator],
        webviewHost: 'machinat.io',
        authSecret: '_SECRET_',
      }),
    ],
    services: [
      { provide: Webview.AuthenticatorList, withProvider: NoneAuthenticator },
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
  await app.stop();
});

test('startHook & stopHook', async () => {
  const fakeBot = moxy({ start: async () => {}, stop: async () => {} });

  const app = Machinat.createApp({
    platforms: [
      Webview.initModule({
        authPlatforms: [NoneAuthenticator],
        webviewHost: 'machinat.io',
        authSecret: '_SECRET_',
        nextServerOptions: { dev: true, conf: { dist: '../../' } },
      }),
    ],
    services: [
      { provide: Webview.Bot, withValue: fakeBot },
      { provide: Webview.AuthenticatorList, withProvider: NoneAuthenticator },
    ],
  });
  await app.start();
  expect(fakeBot.start.mock).toHaveBeenCalledTimes(1);
  expect(fakeBot.stop.mock).not.toHaveBeenCalled();

  const nextServer = createNextServer.mock.calls[0].result;
  expect(nextServer.close.mock).not.toHaveBeenCalled();
  expect(nextServer.prepare.mock).toHaveBeenCalledTimes(1);

  await app.stop();
  expect(fakeBot.stop.mock).toHaveBeenCalledTimes(1);
  expect(nextServer.close.mock).toHaveBeenCalledTimes(1);
});
