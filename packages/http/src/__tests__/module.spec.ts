import { createServer as _createServer } from 'http';
import moxy, { Moxy } from '@moxyjs/moxy';
import Machinat from '@machinat/core';
import { HttpConnector } from '../connector';
import Http from '../module';

const createServer = _createServer as Moxy<typeof _createServer>;

jest.mock('http', () =>
  jest.requireActual('@moxyjs/moxy').default({ createServer() {} })
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
    Object {
      "$$multi": false,
      "$$name": "HttpServer",
      "$$polymorphic": false,
      "$$typeof": Symbol(interface.service.machinat),
    }
  `);

  expect(Http.RequestRouteList).toMatchInlineSnapshot(`
    Object {
      "$$multi": true,
      "$$name": "HttpRequestRouteList",
      "$$polymorphic": false,
      "$$typeof": Symbol(interface.service.machinat),
    }
  `);
  expect(Http.UpgradeRouteList).toMatchInlineSnapshot(`
    Object {
      "$$multi": true,
      "$$name": "HttpUpgradeRouteList",
      "$$polymorphic": false,
      "$$typeof": Symbol(interface.service.machinat),
    }
  `);
  expect(Http.Configs).toMatchInlineSnapshot(`
    Object {
      "$$multi": false,
      "$$name": "HttpConfigs",
      "$$polymorphic": false,
      "$$typeof": Symbol(interface.service.machinat),
    }
  `);
});

test('default provisions', async () => {
  const app = Machinat.createApp({
    modules: [
      Http.initModule({
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

  expect(configs).toEqual({ listenOptions: { host: 'localhost', port: 8888 } });
  expect(connector).toBeInstanceOf(HttpConnector);
  expect(server).toBe(mockServer);
});

test('startHook', async () => {
  const connector = moxy({ connect: async () => {} });
  const app = Machinat.createApp({
    modules: [
      Http.initModule({ listenOptions: { host: 'localhost', port: 8888 } }),
    ],
    services: [{ provide: Http.Connector, withValue: connector }],
  });

  await app.start();

  expect(createServer.mock).toHaveBeenCalledTimes(1);
  expect(connector.connect.mock).toHaveBeenCalledTimes(1);
  expect(connector.connect.mock).toHaveBeenCalledWith(mockServer, {
    host: 'localhost',
    port: 8888,
  });
});

test('stopHook', async () => {
  const app = Machinat.createApp({
    modules: [
      Http.initModule({ listenOptions: { host: 'localhost', port: 8888 } }),
    ],
  });

  await app.start();
  expect(mockServer.close.mock).not.toHaveBeenCalled();

  await app.stop();
  expect(mockServer.close.mock).toHaveBeenCalledTimes(1);
});

test('noServer mode', async () => {
  const connector = moxy({ connect: async () => {} });
  const app = Machinat.createApp({
    modules: [
      Http.initModule({
        noServer: true,
        listenOptions: { host: 'localhost', port: 8888 },
      }),
    ],
    services: [{ provide: Http.Connector, withValue: connector }],
  });

  await app.start();
  expect(createServer.mock).not.toHaveBeenCalled();
  expect(connector.connect.mock).not.toHaveBeenCalled();

  await app.stop();
  expect(mockServer.close.mock).not.toHaveBeenCalled();
});

test('change http server', async () => {
  const myServer = moxy({
    listen: (_, cb) => cb(),
    addListener: () => {},
  });

  const app = Machinat.createApp({
    modules: [
      Http.initModule({
        listenOptions: {
          host: 'localhost',
          port: 8888,
        },
      }),
    ],
    services: [{ provide: Http.Server, withValue: myServer }],
  });

  await app.start();

  expect(createServer.mock).not.toHaveBeenCalled();
  expect(myServer.listen.mock).toHaveBeenCalledTimes(1);
  expect(myServer.listen.mock).toHaveBeenCalledWith(
    { host: 'localhost', port: 8888 },
    expect.any(Function)
  );
  expect(myServer.addListener.mock).toHaveBeenCalled();
});
