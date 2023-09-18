import moxy, { Moxy } from '@moxyjs/moxy';
import NextJs from 'next';
import Sociably from '@sociably/core';
import BaseBot from '@sociably/core/base/Bot';
import BaseMarshaler from '@sociably/core/base/Marshaler';
import Auth from '@sociably/auth';
import BasicAuthenticator from '@sociably/auth/basicAuth';
import Http from '@sociably/http';
import Next from '@sociably/next';
import WebSocket from '@sociably/websocket';
import { InMemoryState } from '@sociably/dev-tools';
import { WebviewReceiver } from '../Receiver.js';
import { WebviewBot } from '../Bot.js';
import WebviewConnection from '../Connection.js';
import NoneAuthenticator from '../authenticators/none/index.js';
import { MemoCacheTarget } from '../authenticators/memo/index.js';
import Webview from '../module.js';

const createNextServer = NextJs as unknown as Moxy<typeof NextJs.default>;

beforeEach(() => {
  createNextServer.mock.reset();
});

it('export interfaces', () => {
  expect(Webview.Configs).toMatchInlineSnapshot(`
    {
      "$$multi": false,
      "$$name": "WebviewConfigs",
      "$$polymorphic": false,
      "$$typeof": Symbol(interface.service.sociably),
    }
  `);

  expect(Webview.Bot).toBe(WebviewBot);
  expect(Webview.Receiver).toBe(WebviewReceiver);
  expect(Webview.SocketServer).toBe(WebSocket.Server);
  expect(Webview.SocketBroker).toBe(WebSocket.Broker);
  expect(Webview.SocketServerId).toBe(WebSocket.ServerId);
  expect(Webview.WsServer).toBe(WebSocket.WsServer);

  expect(Webview.AuthController).toBe(Auth.Controller);
  expect(Webview.AuthenticatorList).toBe(Auth.AuthenticatorList);

  expect(Webview.NextReceiver).toBe(Next.Receiver);
  expect(Webview.NextServer).toBe(Next.Server);
});

test('module object', () => {
  const eventMiddlewares = [moxy((ctx, next) => next(ctx))];
  const dispatchMiddlewares = [moxy((ctx, next) => next(ctx))];

  const module = Webview.initModule({
    authSecret: '_SECRET_',
    authPlatforms: [NoneAuthenticator],
    eventMiddlewares,
    dispatchMiddlewares,
  });

  expect(module.name).toBe('webview');
  expect(module.utilitiesInterface).toMatchInlineSnapshot(`
    {
      "$$multi": false,
      "$$name": "WebviewPlatformUtilities",
      "$$polymorphic": false,
      "$$typeof": Symbol(interface.service.sociably),
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
    webviewPath: 'myView',
    authApiPath: 'myAuth',
    webSocketPath: 'mySocket',
    webviewHost: 'sociably.io',
    authSecret: '_SECRET_',
    nextServerOptions: { dir: './webview', conf: { dist: '../../' } },
  };

  const app = Sociably.createApp({
    modules: [
      Http.initModule({ entryUrl: 'https://sociably.io/foo/', noServer: true }),
    ],
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
    basicAuthenticator,
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
    { require: BasicAuthenticator, optional: true },
  ]);

  expect(configs).toEqual(configsInput);
  expect(bot).toBeInstanceOf(WebviewBot);
  expect(receiver).toBeInstanceOf(WebviewReceiver);
  expect(server).toBeInstanceOf(WebSocket.Server);

  expect(authController).toBeInstanceOf(Auth.Controller);
  expect(authenticators).toEqual([expect.any(NoneAuthenticator)]);

  expect(nextReceiver).toBeInstanceOf(Next.Receiver);
  expect(createNextServer).toHaveBeenCalledTimes(1);
  expect(createNextServer).toHaveBeenCalledWith(configsInput.nextServerOptions);
  expect(nextServer).toBe(createNextServer.mock.calls[0].result);

  expect(requestRoutes).toEqual(
    expect.arrayContaining([
      { name: 'auth', path: 'myAuth', handler: expect.any(Function) },
      { name: 'next', path: 'myView', handler: expect.any(Function) },
    ]),
  );
  expect(upgradeRoutes).toEqual([
    { name: 'websocket', path: 'mySocket', handler: expect.any(Function) },
  ]);
  expect(basicAuthenticator).toBe(null);
  await app.stop();
});

test('with basicAuth', async () => {
  const basicAuthOptions = {
    appName: 'Hello World',
    appIconUrl: 'https://sociably.io/img/logo.png',
  };
  const app = Sociably.createApp({
    platforms: [
      Webview.initModule({
        authPlatforms: [NoneAuthenticator],
        authSecret: '_SECRET_',
        basicAuth: basicAuthOptions,
      }),
    ],
    modules: [
      Http.initModule({ entryUrl: 'https://sociably.io/foo/', noServer: true }),
      InMemoryState.initModule(),
    ],
    services: [{ provide: Auth.AuthenticatorList, withValue: moxy() }],
  });
  await app.start();

  const [basicAuthenticator] = app.useServices([BasicAuthenticator]);
  expect(basicAuthenticator).toBeInstanceOf(BasicAuthenticator);
  expect(basicAuthenticator.appName).toBe('Hello World');
  expect(basicAuthenticator.appIconUrl).toBe(
    'https://sociably.io/img/logo.png',
  );
});

test('with noNextServer option', async () => {
  const configsInput = {
    authPlatforms: [NoneAuthenticator],
    webviewPath: 'myView',
    authApiPath: 'myAuth',
    webSocketPath: 'mySocket',
    webviewHost: 'sociably.io',
    authSecret: '_SECRET_',
    noNextServer: true,
  };
  const app = Sociably.createApp({
    modules: [
      Http.initModule({ entryUrl: 'https://sociably.io/foo/', noServer: true }),
    ],
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
    ],
  );

  expect(nextReceiver).toBe(null);
  expect(nextServer).toBe(null);
  expect(createNextServer).not.toHaveBeenCalled();

  expect(requestRoutes).toEqual([
    { name: 'auth', path: 'myAuth', handler: expect.any(Function) },
  ]);
  await app.stop();
});

test('default routing paths', async () => {
  const app = Sociably.createApp({
    modules: [
      Http.initModule({ entryUrl: 'https://sociably.io/foo/', noServer: true }),
    ],
    platforms: [
      Webview.initModule({
        authPlatforms: [NoneAuthenticator],
        authSecret: '_SECRET_',
      }),
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
      path: 'auth',
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
      path: 'websocket',
      handler: expect.any(Function),
    },
  ]);
  await app.stop();
});

test('provide base interfaces', async () => {
  const app = Sociably.createApp({
    modules: [
      Http.initModule({ entryUrl: 'https://sociably.io/foo/', noServer: true }),
    ],
    platforms: [
      Webview.initModule({
        authPlatforms: [NoneAuthenticator],
        authSecret: '_SECRET_',
      }),
    ],
  });
  await app.start();

  const [bots, marshalTypes] = app.useServices([
    BaseBot.PlatformMap,
    BaseMarshaler.TypeList,
  ]);

  expect(bots.get('webview')).toBeInstanceOf(WebviewBot);
  expect(marshalTypes).toEqual(
    expect.arrayContaining([WebviewConnection, MemoCacheTarget]),
  );
  await app.stop();
});

test('register hmr route when dev', async () => {
  let app = Sociably.createApp({
    modules: [
      Http.initModule({ entryUrl: 'https://sociably.io/foo/', noServer: true }),
    ],
    platforms: [
      Webview.initModule({
        authPlatforms: [NoneAuthenticator],
        authSecret: '_SECRET_',
        nextServerOptions: { dev: true },
      }),
    ],
  });
  await app.start();
  let [upgradeRoutings] = app.useServices([Http.UpgradeRouteList]);
  expect(upgradeRoutings).toMatchInlineSnapshot(`
    [
      {
        "handler": [Function],
        "name": "websocket",
        "path": "websocket",
      },
      {
        "default": true,
        "handler": [Function],
        "name": "webpack-hmr",
      },
    ]
  `);

  app = Sociably.createApp({
    modules: [
      Http.initModule({ entryUrl: 'https://sociably.io/foo/', noServer: true }),
    ],
    platforms: [
      Webview.initModule({
        authPlatforms: [NoneAuthenticator],
        webviewPath: 'webview',
        authSecret: '_SECRET_',
        nextServerOptions: { dev: true },
      }),
    ],
  });
  await app.start();
  [upgradeRoutings] = app.useServices([Http.UpgradeRouteList]);
  expect(upgradeRoutings).toMatchInlineSnapshot(`
    [
      {
        "handler": [Function],
        "name": "websocket",
        "path": "websocket",
      },
      {
        "handler": [Function],
        "name": "webpack-hmr",
        "path": "webview",
      },
    ]
  `);

  app = Sociably.createApp({
    modules: [
      Http.initModule({ entryUrl: 'https://sociably.io/foo/', noServer: true }),
    ],
    platforms: [
      Webview.initModule({
        authPlatforms: [NoneAuthenticator],
        authSecret: '_SECRET_',
        nextServerOptions: { dev: false },
      }),
    ],
  });
  await app.start();

  [upgradeRoutings] = app.useServices([Http.UpgradeRouteList]);
  expect(upgradeRoutings.length).toBe(1);
});

test('startHook & stopHook', async () => {
  const fakeBot = moxy({ start: async () => {}, stop: async () => {} });

  const app = Sociably.createApp({
    modules: [
      Http.initModule({ entryUrl: 'https://sociably.io/foo/', noServer: true }),
    ],
    platforms: [
      Webview.initModule({
        authPlatforms: [NoneAuthenticator],
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
  expect(fakeBot.start).toHaveBeenCalledTimes(1);
  expect(fakeBot.stop).not.toHaveBeenCalled();

  const nextServer = createNextServer.mock.calls[0].result;
  expect(nextServer.close).not.toHaveBeenCalled();
  expect(nextServer.prepare).toHaveBeenCalledTimes(1);

  await app.stop();
  expect(fakeBot.stop).toHaveBeenCalledTimes(1);
  expect(nextServer.close).toHaveBeenCalledTimes(1);
});
