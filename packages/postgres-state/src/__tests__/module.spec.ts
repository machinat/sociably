import moxy, { Moxy } from '@moxyjs/moxy';
import { Pool as _Pool } from 'pg';
import Sociably from '@sociably/core';
import StateRepositoryI from '@sociably/core/base/StateRepository.js';
import PostgresState from '../module.js';
import { RepositoryP as PostgresStateRepository } from '../PostgresStateRepository.js';

const Pool = _Pool as Moxy<typeof _Pool>;

jest.mock('pg', () =>
  moxy({
    Pool: function FakedPool() {},
  }),
);

test('export interfaces', () => {
  expect(PostgresState.Repository).toBe(PostgresStateRepository);
  expect(PostgresState.Configs).toMatchInlineSnapshot(`
    {
      "$$multi": false,
      "$$name": "PostgresStateConfigs",
      "$$polymorphic": false,
      "$$typeof": Symbol(interface.service.sociably),
    }
  `);
  expect(PostgresState.ConnectionPool).toMatchInlineSnapshot(`
    {
      "$$multi": false,
      "$$name": "PostgresConnectionPool",
      "$$polymorphic": false,
      "$$typeof": Symbol(interface.service.sociably),
    }
  `);
});

test('provisions', async () => {
  const app = Sociably.createApp({
    modules: [
      PostgresState.initModule({
        connectOptions: { host: 'my.postgres.com', port: 5432 },
      }),
    ],
  });
  await app.start();

  const [controller, pool, configs] = app.useServices([
    PostgresStateRepository,
    PostgresState.ConnectionPool,
    PostgresState.Configs,
  ]);

  expect(controller).toBeInstanceOf(PostgresStateRepository);
  expect(pool).toBe(Pool.mock.calls[0].instance);
  expect(configs).toEqual({
    connectOptions: { host: 'my.postgres.com', port: 5432 },
  });

  expect(Pool).toHaveBeenCalledWith({
    host: 'my.postgres.com',
    port: 5432,
  });
});

test('provide base state controller', async () => {
  const app = Sociably.createApp({
    modules: [
      PostgresState.initModule({
        connectOptions: { host: 'my.postgres.com', port: 5432 },
      }),
    ],
  });
  await app.start();

  const [controller] = app.useServices([StateRepositoryI]);
  expect(controller).toBeInstanceOf(PostgresStateRepository);
});
