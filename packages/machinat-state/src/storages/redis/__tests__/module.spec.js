import moxy from '@moxyjs/moxy';
import redis from 'redis';
import EventEmitter from 'events';
import Machinat from '@machinat/core';
import Base from '@machinat/core/base';
import RedisState from '..';
import { RedisRepository } from '../repository';
import StateController from '../../..';

jest.mock('redis', () =>
  jest.requireActual('@moxyjs/moxy').default({
    createClient: () => ({ connected: true }),
  })
);

test('export interfaces', () => {
  expect(RedisState.Repository).toBe(RedisRepository);
  expect(RedisState.CONFIGS_I).toMatchInlineSnapshot(`
    Object {
      "$$multi": false,
      "$$name": "RedisStateModuleConfigsI",
      "$$typeof": Symbol(machinat.services.interface),
    }
  `);
  expect(RedisState.CLIENT_I).toMatchInlineSnapshot(`
    Object {
      "$$multi": false,
      "$$name": "RedisClientI",
      "$$typeof": Symbol(machinat.services.interface),
    }
  `);
});

test('provisions', async () => {
  const app = Machinat.createApp({
    modules: [
      RedisState.initModule({
        clientOptions: { host: 'my.redis.com', port: 23456 },
      }),
    ],
  });
  await app.start();

  const [controller, repository, client, configs] = app.useServices([
    StateController,
    RedisState.Repository,
    RedisState.CLIENT_I,
    RedisState.CONFIGS_I,
  ]);

  expect(controller).toBeInstanceOf(StateController);
  expect(repository).toBeInstanceOf(RedisRepository);
  expect(client).toBe(redis.createClient.mock.calls[0].result);
  expect(configs).toEqual({
    clientOptions: { host: 'my.redis.com', port: 23456 },
  });

  expect(redis.createClient.mock).toHaveBeenCalledWith({
    host: 'my.redis.com',
    port: 23456,
  });
});

test('provide base state controller', async () => {
  const app = Machinat.createApp({
    modules: [
      RedisState.initModule({
        clientOptions: { host: 'my.redis.com', port: 23456 },
      }),
    ],
  });
  await app.start();

  const [controller] = app.useServices([Base.StateControllerI]);
  expect(controller).toBeInstanceOf(StateController);
});

test('startHook wait for client connected', async () => {
  const app = Machinat.createApp({
    modules: [
      RedisState.initModule({
        clientOptions: { host: 'my.redis.com', port: 23456 },
      }),
    ],
  });

  const client = moxy(new EventEmitter());
  client.connected = false;

  redis.createClient.mock.fakeReturnValue(client);
  const startPromise = app.start();

  expect(client.once.mock).toHaveBeenCalledTimes(2);
  expect(app.isStarted).toBe(false);

  client.emit('connect');
  client.emit('ready');

  await startPromise;
  expect(app.isStarted).toBe(true);
});

test('startHook throw if error happen when connect', async () => {
  const app = Machinat.createApp({
    modules: [
      RedisState.initModule({
        clientOptions: { host: 'my.redis.com', port: 23456 },
      }),
    ],
  });

  const client = moxy(new EventEmitter());
  client.connected = false;

  redis.createClient.mock.fakeReturnValue(client);
  const startPromise = app.start();
  expect(app.isStarted).toBe(false);

  client.emit('error', new Error('connect fail'));

  await expect(startPromise).rejects.toThrow('connect fail');
});
