import { createServer } from 'http';
import moxy from 'moxy';
import Machinat from '@machinat/core';
import HTTP from '..';

jest.mock('http', () => require('moxy').default({ createServer() {} })); // eslint-disable-line global-require

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

it('provide configs', async () => {
  const configs = {
    basePath: '/foo',
    listenOptions: {
      host: 'localhost',
      port: 8888,
    },
  };
  const app = Machinat.createApp({
    imports: [HTTP.initModule(configs)],
  });
  await app.start();

  expect(app.useServices([HTTP.CONFIGS])).toEqual([configs]);
});

it('provide http server by default', async () => {
  const connector = moxy({ connect: async () => {} });

  const app = Machinat.createApp({
    imports: [
      HTTP.initModule({
        basePath: '/foo',
        listenOptions: {
          host: 'localhost',
          port: 8888,
        },
      }),
    ],
    registers: [{ provide: HTTP.Connector, withValue: connector }],
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
    imports: [
      HTTP.initModule({
        basePath: '/foo',
        listenOptions: {
          host: 'localhost',
          port: 8888,
        },
      }),
    ],
    registers: [{ provide: HTTP.Server, withValue: myServer }],
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
