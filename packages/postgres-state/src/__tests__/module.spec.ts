import { Moxy } from '@moxyjs/moxy';
import { Pool as _Pool } from 'pg';
import Sociably from '@sociably/core';
import StateControllerI from '@sociably/core/base/StateController';
import PostgresState from '../module';
import { ControllerP as PostgresStateController } from '../controller';

const Pool = _Pool as Moxy<typeof _Pool>;

jest.mock('pg', () =>
  jest.requireActual('@moxyjs/moxy').default({
    Pool: function FakedPool() {},
  })
);

test('export interfaces', () => {
  expect(PostgresState.Controller).toBe(PostgresStateController);
  expect(PostgresState.Configs).toMatchInlineSnapshot(`
    Object {
      "$$multi": false,
      "$$name": "PostgresStateConfigs",
      "$$polymorphic": false,
      "$$typeof": Symbol(interface.service.sociably),
    }
  `);
  expect(PostgresState.ConnectionPool).toMatchInlineSnapshot(`
    Object {
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
    PostgresStateController,
    PostgresState.ConnectionPool,
    PostgresState.Configs,
  ]);

  expect(controller).toBeInstanceOf(PostgresStateController);
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

  const [controller] = app.useServices([StateControllerI]);
  expect(controller).toBeInstanceOf(PostgresStateController);
});
