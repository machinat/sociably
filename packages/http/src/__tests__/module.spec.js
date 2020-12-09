import { createServer } from 'http';
import moxy from '@moxyjs/moxy';
import Machinat from '@machinat/core';
import { HTTPConnector } from '../connector';
import HTTP from '../module';

jest.mock('http', () =>
  jest.requireActual('@moxyjs/moxy').default({ createServer() {} })
);

const server = moxy({
  addListener() {},
  listen(_, cb) {
    cb();
  },
});
createServer.mock.fake(() => server);

beforeEach(() => {
  createServer.mock.clear();
  server.mock.reset();
});

it('export interfaces', () => {
  expect(HTTP.Connector).toBe(HTTPConnector);

  expect(HTTP.ServerI).toMatchInlineSnapshot(`
    Object {
      "$$branched": false,
      "$$multi": false,
      "$$name": "HTTPServerI",
      "$$typeof": Symbol(interface.service.machinat),
    }
  `);

  expect(HTTP.REQUEST_ROUTINGS_I).toMatchInlineSnapshot(`
    Object {
      "$$branched": false,
      "$$multi": true,
      "$$name": "HTTPRequestRoutingsListI",
      "$$typeof": Symbol(interface.service.machinat),
    }
  `);
  expect(HTTP.UPGRADE_ROUTINGS_I).toMatchInlineSnapshot(`
    Object {
      "$$branched": false,
      "$$multi": true,
      "$$name": "HTTPUpgradeRoutingsListI",
      "$$typeof": Symbol(interface.service.machinat),
    }
  `);
  expect(HTTP.CONFIGS_I).toMatchInlineSnapshot(`
    Object {
      "$$branched": false,
      "$$multi": false,
      "$$name": "HTTPModuleConfigsI",
      "$$typeof": Symbol(interface.service.machinat),
    }
  `);
});

it('provide configs', async () => {
  const configs = {
    host: 'localhost',
    port: 8888,
  };
  const app = Machinat.createApp({
    modules: [HTTP.initModule(configs)],
  });
  await app.start();

  expect(app.useServices([HTTP.CONFIGS_I])).toEqual([configs]);
});

it('provide http server by default', async () => {
  const connector = moxy({ connect: async () => {} });

  const app = Machinat.createApp({
    modules: [
      HTTP.initModule({
        host: 'localhost',
        port: 8888,
      }),
    ],
    bindings: [{ provide: HTTP.Connector, withValue: connector }],
  });

  await app.start();

  expect(createServer.mock).toHaveBeenCalledTimes(1);

  expect(connector.connect.mock).toHaveBeenCalledTimes(1);
  expect(connector.connect.mock).toHaveBeenCalledWith(server, {
    host: 'localhost',
    port: 8888,
  });
});

test('change http server', async () => {
  const myServer = moxy({
    listen: (_, cb) => cb(),
    addListener: () => {},
  });

  const app = Machinat.createApp({
    modules: [
      HTTP.initModule({
        host: 'localhost',
        port: 8888,
      }),
    ],
    bindings: [{ provide: HTTP.ServerI, withValue: myServer }],
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
