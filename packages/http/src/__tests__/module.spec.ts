import { createServer as _createServer } from 'http';
import moxy, { Moxy } from '@moxyjs/moxy';
import Sociably from '@sociably/core';
import { HttpConnector } from '../Connector.js';
import Http from '../module.js';

const createServer = _createServer as Moxy<typeof _createServer>;

jest.mock('http', () =>
  jest.requireActual('@moxyjs/moxy').default({ createServer() {} }),
);

const mockServer = moxy({
  addListener() {},
  listen(_, cb) {
    cb();
  },
  close(cb) {
    cb();
  },
});
createServer.mock.fake(() => mockServer);

beforeEach(() => {
  createServer.mock.clear();
  mockServer.mock.reset();
});

test('exported interfaces', () => {
  expect(Http.Connector).toBe(HttpConnector);

  expect(Http.Server).toMatchInlineSnapshot(`
    {
      "$$multi": false,
      "$$name": "HttpServer",
      "$$polymorphic": false,
      "$$typeof": Symbol(interface.service.sociably),
    }
  `);

  expect(Http.RequestRouteList).toMatchInlineSnapshot(`
    {
      "$$multi": true,
      "$$name": "HttpRequestRouteList",
      "$$polymorphic": false,
      "$$typeof": Symbol(interface.service.sociably),
    }
  `);
  expect(Http.UpgradeRouteList).toMatchInlineSnapshot(`
    {
      "$$multi": true,
      "$$name": "HttpUpgradeRouteList",
      "$$polymorphic": false,
      "$$typeof": Symbol(interface.service.sociably),
    }
  `);
  expect(Http.Configs).toMatchInlineSnapshot(`
    {
      "$$multi": false,
      "$$name": "HttpConfigs",
      "$$polymorphic": false,
      "$$typeof": Symbol(interface.service.sociably),
    }
  `);
});

test('default provisions', async () => {
  const app = Sociably.createApp({
    modules: [
      Http.initModule({
        entryUrl: 'https://sociably.io/foo/',
        listenOptions: {
          host: 'localhost',
          port: 8888,
        },
      }),
    ],
  });
  await app.start();

  const [configs, connector, server] = app.useServices([
    Http.Configs,
    Http.Connector,
    Http.Server,
  ]);

  expect(configs).toEqual({
    entryUrl: 'https://sociably.io/foo/',
    listenOptions: { host: 'localhost', port: 8888 },
  });
  expect(connector).toBeInstanceOf(HttpConnector);
  expect(server).toBe(mockServer);
});

test('startHook', async () => {
  const connector = moxy({ connect: async () => {} });
  const app = Sociably.createApp({
    modules: [
      Http.initModule({
        entryUrl: 'https://sociably.io/foo/',
        listenOptions: { host: 'localhost', port: 8888 },
      }),
    ],
    services: [{ provide: Http.Connector, withValue: connector }],
  });

  await app.start();

  expect(createServer).toHaveBeenCalledTimes(1);
  expect(connector.connect).toHaveBeenCalledTimes(1);
  expect(connector.connect).toHaveBeenCalledWith(mockServer, {
    host: 'localhost',
    port: 8888,
  });
});

test('stopHook', async () => {
  const app = Sociably.createApp({
    modules: [
      Http.initModule({
        entryUrl: 'https://sociably.io/foo/',
        listenOptions: { host: 'localhost', port: 8888 },
      }),
    ],
  });

  await app.start();
  expect(mockServer.close).not.toHaveBeenCalled();

  await app.stop();
  expect(mockServer.close).toHaveBeenCalledTimes(1);
});

test('noServer mode', async () => {
  const connector = moxy({ connect: async () => {} });
  const app = Sociably.createApp({
    modules: [
      Http.initModule({
        entryUrl: 'https://sociably.io/foo/',
        noServer: true,
        listenOptions: { host: 'localhost', port: 8888 },
      }),
    ],
    services: [{ provide: Http.Connector, withValue: connector }],
  });

  await app.start();
  expect(createServer).not.toHaveBeenCalled();
  expect(connector.connect).not.toHaveBeenCalled();

  await app.stop();
  expect(mockServer.close).not.toHaveBeenCalled();
});

test('change http server', async () => {
  const myServer = moxy({
    listen: (_, cb) => cb(),
    addListener: () => {},
  });

  const app = Sociably.createApp({
    modules: [
      Http.initModule({
        entryUrl: 'https://sociably.io/foo/',
        listenOptions: {
          host: 'localhost',
          port: 8888,
        },
      }),
    ],
    services: [{ provide: Http.Server, withValue: myServer }],
  });

  await app.start();

  expect(createServer).not.toHaveBeenCalled();
  expect(myServer.listen).toHaveBeenCalledTimes(1);
  expect(myServer.listen).toHaveBeenCalledWith(
    { host: 'localhost', port: 8888 },
    expect.any(Function),
  );
  expect(myServer.addListener).toHaveBeenCalled();
});
