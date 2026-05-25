import { Pool } from 'pg';
import type { PoolClient } from 'pg';
import moxy, { isMoxy } from '@moxyjs/moxy';
import type { Moxy } from '@moxyjs/moxy';
import { SociablyThread, SociablyAgent, SociablyUser } from '@sociably/core';
import { StateAccessor } from '@sociably/core/base/StateRepository.js';
import {
  DEFAULT_GLOBAL_STATE_TABLE_NAME,
  DEFAULT_AGENT_STATE_TABLE_NAME,
  DEFAULT_THREAD_STATE_TABLE_NAME,
  DEFAULT_USER_STATE_TABLE_NAME,
  FIELD_STATE_KEY,
  FIELD_STATE_ID,
  FIELD_STATE_DATA,
  FIELD_CREATED_AT,
  FIELD_UPDATED_AT,
} from '../constants.js';
import { PostgresStateRepository } from '../PostgresStateRepository.js';

type QueryInput =
  | string
  | {
      text: string;
      values?: unknown[];
    };

type QueryCall = {
  args: unknown[];
};

type StateEntityRow = {
  [FIELD_STATE_ID]: string;
  [FIELD_STATE_KEY]: string;
  [FIELD_STATE_DATA]: { value: unknown };
  [FIELD_CREATED_AT]: Date;
  [FIELD_UPDATED_AT]: Date;
};

type Marshaler = {
  marshal: (value: unknown) => unknown;
  unmarshal: (value: unknown) => unknown;
};

type MoxiedPoolClient = PoolClient & {
  query: Moxy<PoolClient['query']>;
};

const pgPool = moxy(new Pool({ connectionString: process.env.DATABASE_URL }), {
  mockMethod: false,
  includeProperties: ['query', 'connect'],
});
afterAll(async () => {
  await pgPool.end();
});

let usedClients: MoxiedPoolClient[] = [];
pgPool.connect.mock.wrap(
  (connect) =>
    async function connectWithMoxiedClient(
      this: Pool,
      callback?: (
        err: Error,
        client: PoolClient,
        release: (...args: unknown[]) => void,
      ) => void,
    ) {
      if (callback) {
        return connect.call(this, callback);
      }
      const client = (await connect.call(this)) as MoxiedPoolClient;
      const { query } = client;
      if (!isMoxy(query)) {
        client.query = moxy(query) as Moxy<PoolClient['query']>;
      } else {
        query.mock.reset();
      }
      usedClients.push(client);
      return client;
    },
);

const marshaler: Moxy<Marshaler> = moxy({
  marshal: (x: unknown) => x,
  unmarshal: (x: unknown) => x,
});

const getQueryInput = ({ args: [query] }: QueryCall): QueryInput =>
  query as QueryInput;

const getIdenticalQueryCallsText = (queryCalls: QueryCall[]): string | null =>
  queryCalls.reduce<string | null>((queryText, call) => {
    const query = getQueryInput(call);
    const text = typeof query === 'string' ? query : query.text;
    if (queryText) {
      expect(text).toBe(queryText);
    }
    return text;
  }, null);
const getQueryCallsText = (queryCalls: QueryCall[]): string[] =>
  queryCalls.map((call) => {
    const query = getQueryInput(call);
    return typeof query === 'string' ? query : query.text;
  });
const getQueryCallsValues = (
  queryCalls: QueryCall[],
): (unknown[] | undefined)[] =>
  queryCalls.map((call) => {
    const query = getQueryInput(call);
    return typeof query === 'string' ? undefined : query.values;
  });

describe.each<[string, Record<string, string>]>([
  ['default table', {}],
  [
    'specified table',
    {
      globalStateTableName: 'my_global_state',
      agentStateTableName: 'my_agent_state',
      threadStateTableName: 'my_thread_state',
      userStateTableName: 'my_user_state',
    },
  ],
  [
    'specified schema & table',
    {
      schemaName: 'my_schema',
      globalStateTableName: 'my_global_state',
      agentStateTableName: 'my_agent_state',
      threadStateTableName: 'my_thread_state',
      userStateTableName: 'my_user_state',
    },
  ],
])('%s', (_, options) => {
  const repository = new PostgresStateRepository(pgPool, marshaler, options);

  beforeAll(async () => {
    await repository.createTables();
  });

  afterAll(async () => {
    await repository.dropTables();
  });

  const schemaPrefix = options.schemaName ? `"${options.schemaName}".` : '';
  const agentStateTableName =
    options.agentStateTableName || DEFAULT_AGENT_STATE_TABLE_NAME;
  const threadStateTableName =
    options.threadStateTableName || DEFAULT_THREAD_STATE_TABLE_NAME;
  const userStateTableName =
    options.userStateTableName || DEFAULT_USER_STATE_TABLE_NAME;
  const globalStateTableName =
    options.globalStateTableName || DEFAULT_GLOBAL_STATE_TABLE_NAME;

  describe.each<
    [
      string, // test name
      StateAccessor, // state accessor object
      string, // table name
      string, // expected state id
    ]
  >([
    [
      'agent state',
      repository.agentState({
        platform: 'test',
        uid: 'test.foo',
      } as SociablyAgent),
      `${schemaPrefix}"${agentStateTableName}"`,
      'test.foo',
    ],
    [
      'agent state with scope id',
      repository.agentState({
        platform: 'test',
        uid: 'test.foo.1',
      } as SociablyAgent),
      `${schemaPrefix}"${agentStateTableName}"`,
      'test.foo.1',
    ],
    [
      'thread state',
      repository.threadState({
        platform: 'test',
        uid: 'test.foo',
      } as SociablyThread),
      `${schemaPrefix}"${threadStateTableName}"`,
      'test.foo',
    ],
    [
      'thread state with scope id',
      repository.threadState({
        platform: 'test',
        uid: 'test.foo.1',
      } as SociablyThread),
      `${schemaPrefix}"${threadStateTableName}"`,
      'test.foo.1',
    ],
    [
      'user state',
      repository.userState({
        platform: 'test',
        uid: 'test.foo.john',
      } as SociablyUser),
      `${schemaPrefix}"${userStateTableName}"`,
      'test.foo.john',
    ],
    [
      'user state with scope id',
      repository.userState({
        platform: 'test',
        uid: 'test.foo.jane',
      } as SociablyUser),
      `${schemaPrefix}"${userStateTableName}"`,
      'test.foo.jane',
    ],
    [
      'global state',
      repository.globalState('MY_SUPER_STATE'),
      `${schemaPrefix}"${globalStateTableName}"`,
      'MY_SUPER_STATE',
    ],
  ])('%s', (__, state, tableId, stateId) => {
    const insertStateEntities = (pairs: [string, unknown][]) =>
      pgPool.query({
        text: `
          INSERT INTO ${tableId} (
          "${FIELD_STATE_ID}",
            "${FIELD_STATE_KEY}",
            "${FIELD_STATE_DATA}"
          ) VALUES ${pairs
            .map((_p, i) => `($${i * 3 + 1}, $${i * 3 + 2}, $${i * 3 + 3})`)
            .join(', ')};
        `,
        values: pairs.flatMap(([key, value]) => [
          stateId,
          key,
          JSON.stringify({ value }),
        ]),
      });

    const getStateEntities = async (): Promise<StateEntityRow[]> => {
      const result = await pgPool.query({
        text: `
            SELECT * FROM ${tableId} WHERE
            "${FIELD_STATE_ID}" = $1;
          `,
        values: [stateId],
      });
      return result.rows;
    };
    const getStateEntityOfKey = async (key: string) => {
      const entities = await getStateEntities();
      return entities.find(
        ({ [FIELD_STATE_KEY]: entityKey }) => key === entityKey,
      );
    };

    beforeEach(async () => {
      await insertStateEntities([
        ['key2', 'foo'],
        ['key3', 123],
        ['key4', { bar: 'baz' }],
        ['key5', [{ a: 0 }, { b: 1 }, { c: 2 }]],
        ['key6', null],
      ]);

      usedClients = [];
      pgPool.mock.clear();
      marshaler.mock.reset();
    });
    afterEach(async () => {
      await pgPool.query(`DELETE FROM ${tableId};`);
    });

    test('.get(key)', async () => {
      await Promise.all(
        (
          [
            ['key1', undefined],
            ['key2', 'foo'],
            ['key3', 123],
            ['key4', { bar: 'baz' }],
            ['key5', [{ a: 0 }, { b: 1 }, { c: 2 }]],
            ['key6', null],
          ] as const
        ).map(async ([key, value]) => {
          await expect(state.get(key)).resolves.toEqual(value);
        }),
      );

      expect(
        getIdenticalQueryCallsText(pgPool.query.mock.calls),
      ).toMatchSnapshot();
      expect(getQueryCallsValues(pgPool.query.mock.calls)).toMatchSnapshot();
    });

    test('.set(key, value)', async () => {
      await Promise.all(
        (
          [
            ['key1', 'foo', false],
            ['key2', 'bar', true],
            ['key3', 456, true],
            ['key4', { bar: 'bae' }, true],
            ['key5', [1, 2, 3], true],
            ['key6', {}, true],
          ] as const
        ).map(async ([key, value, isUpdated]) => {
          await expect(state.set(key, value)).resolves.toBe(isUpdated);
        }),
      );

      expect(
        getIdenticalQueryCallsText(pgPool.query.mock.calls),
      ).toMatchSnapshot();
      expect(getQueryCallsValues(pgPool.query.mock.calls)).toMatchSnapshot();
    });

    describe('.update(key, updater)', () => {
      it('update value', async () => {
        const cases = [
          ['key1', undefined, 'foo'],
          ['key2', 'foo', 'bar'],
          ['key3', 123, 456],
          ['key4', { bar: 'baz' }, { bar: 'bae' }],
          ['key5', [{ a: 0 }, { b: 1 }, { c: 2 }], [1, 2, 3]],
          ['key6', null, {}],
        ] as const;
        await Promise.all(
          cases.map(async ([key, originalValue, newValue]) => {
            const updator = moxy(() => newValue);
            await expect(state.update(key, updator)).resolves.toEqual(newValue);

            expect(updator.mock).toHaveBeenCalledTimes(1);
            expect(updator.mock).toHaveBeenCalledWith(originalValue);
          }),
        );

        const queryTexts = getQueryCallsText(usedClients[0].query.mock.calls);
        expect(queryTexts).toMatchSnapshot();

        for (const client of usedClients) {
          expect(getQueryCallsText(client.query.mock.calls)).toEqual(
            queryTexts,
          );
        }

        expect(
          usedClients.map((client) =>
            getQueryCallsValues(client.query.mock.calls).filter(
              (value: unknown[] | undefined) => value,
            ),
          ),
        ).toMatchSnapshot();

        await expect(getStateEntities()).resolves.toEqual(
          expect.arrayContaining(
            cases.map(([key, , newValue]) => ({
              [FIELD_STATE_ID]: stateId,
              [FIELD_STATE_KEY]: key,
              [FIELD_STATE_DATA]: { value: newValue },
              [FIELD_CREATED_AT]: expect.any(Date),
              [FIELD_UPDATED_AT]: expect.any(Date),
            })),
          ),
        );
      });

      it('delete entity if updater returns `undefined`', async () => {
        const updater = moxy(() => undefined);
        await expect(state.update('key2', updater)).resolves.toBe(undefined);

        expect(updater.mock).toHaveBeenCalledTimes(1);
        expect(updater.mock).toHaveBeenCalledWith('foo');

        const queryCalls = usedClients[0].query.mock.calls;
        expect(getQueryCallsText(queryCalls)).toMatchSnapshot();
        expect(
          getQueryCallsValues(queryCalls).filter(
            (value: unknown[] | undefined) => value,
          ),
        ).toMatchSnapshot();

        await expect(getStateEntityOfKey('key2')).resolves.toBe(undefined);
      });

      it('make no change if the new value is identical with old value', async () => {
        const cases = [
          ['key2', 'foo'],
          ['key3', 123],
          ['key4', { bar: 'baz' }],
          ['key5', [{ a: 0 }, { b: 1 }, { c: 2 }]],
          ['key6', null],
        ] as const;
        await Promise.all(
          cases.map(async ([key, value]) => {
            const updater = moxy((x: unknown) => x);
            await expect(state.update(key, updater)).resolves.toEqual(value);

            expect(updater.mock).toHaveBeenCalledTimes(1);
            expect(updater.mock).toHaveBeenCalledWith(value);
          }),
        );

        const queryCalls = usedClients[0].query.mock.calls;
        expect(getQueryCallsText(queryCalls)).toMatchSnapshot();

        for (const client of usedClients) {
          expect(getQueryCallsText(client.query.mock.calls)).toEqual(
            getQueryCallsText(queryCalls),
          );
        }

        expect(
          usedClients.map((client) =>
            getQueryCallsValues(client.query.mock.calls).filter(
              (value: unknown[] | undefined) => value,
            ),
          ),
        ).toMatchSnapshot();

        await expect(getStateEntities()).resolves.toEqual(
          expect.arrayContaining(
            cases.map(([key, value]) => ({
              [FIELD_STATE_ID]: stateId,
              [FIELD_STATE_KEY]: key,
              [FIELD_STATE_DATA]: { value },
              [FIELD_CREATED_AT]: expect.any(Date),
              [FIELD_UPDATED_AT]: expect.any(Date),
            })),
          ),
        );
      });
    });

    test('.delete(key)', async () => {
      await Promise.all(
        (
          [
            ['key1', false],
            ['key2', true],
            ['key3', true],
            ['key4', true],
            ['key5', true],
            ['key6', true],
          ] as const
        ).map(async ([key, isDeleted]) => {
          await expect(state.delete(key)).resolves.toBe(isDeleted);
        }),
      );

      expect(
        getIdenticalQueryCallsText(pgPool.query.mock.calls),
      ).toMatchSnapshot();
      expect(getQueryCallsValues(pgPool.query.mock.calls)).toMatchSnapshot();

      await expect(getStateEntities()).resolves.toEqual([]);
    });

    test('.clear()', async () => {
      await expect(state.clear()).resolves.toBe(undefined);

      expect(
        getIdenticalQueryCallsText(pgPool.query.mock.calls),
      ).toMatchSnapshot();
      expect(getQueryCallsValues(pgPool.query.mock.calls)).toMatchSnapshot();

      await expect(getStateEntities()).resolves.toEqual([]);
    });

    test('.keys()', async () => {
      await expect(state.keys()).resolves.toEqual(
        expect.arrayContaining(['key2', 'key3', 'key4', 'key5', 'key6']),
      );

      expect(
        getIdenticalQueryCallsText(pgPool.query.mock.calls),
      ).toMatchSnapshot();
      expect(getQueryCallsValues(pgPool.query.mock.calls)).toMatchSnapshot();
    });

    test('.getAll()', async () => {
      await expect(state.getAll()).resolves.toEqual(
        new Map<string, unknown>([
          ['key2', 'foo'],
          ['key3', 123],
          ['key4', { bar: 'baz' }],
          ['key5', [{ a: 0 }, { b: 1 }, { c: 2 }]],
          ['key6', null],
        ]),
      );

      expect(
        getIdenticalQueryCallsText(pgPool.query.mock.calls),
      ).toMatchSnapshot();
      expect(getQueryCallsValues(pgPool.query.mock.calls)).toMatchSnapshot();
    });

    test('.getAllStartWithKey(prefix)', async () => {
      await expect(state.getAllStartWithKey('key')).resolves.toEqual(
        new Map<string, unknown>([
          ['key2', 'foo'],
          ['key3', 123],
          ['key4', { bar: 'baz' }],
          ['key5', [{ a: 0 }, { b: 1 }, { c: 2 }]],
          ['key6', null],
        ]),
      );

      await expect(state.getAllStartWithKey('key2')).resolves.toEqual(
        new Map([['key2', 'foo']]),
      );

      expect(
        getIdenticalQueryCallsText(pgPool.query.mock.calls),
      ).toMatchSnapshot();
      expect(getQueryCallsValues(pgPool.query.mock.calls)).toMatchSnapshot();
    });

    test('custom marshaler', async () => {
      marshaler.marshal.mock.fake((value: unknown) => ({ hello: value }));
      marshaler.unmarshal.mock.fake(({ hello }: { hello: unknown }) => hello);

      await expect(state.set('key1', 'foo')).resolves.toBe(false);
      await expect(state.get('key1')).resolves.toBe('foo');
      await expect(getStateEntityOfKey('key1')).resolves.toEqual({
        [FIELD_STATE_ID]: stateId,
        [FIELD_STATE_KEY]: 'key1',
        [FIELD_STATE_DATA]: { value: { hello: 'foo' } },
        [FIELD_CREATED_AT]: expect.any(Date),
        [FIELD_UPDATED_AT]: expect.any(Date),
      });

      const updater = moxy(() => ({ bar: 'baz' }));
      await expect(state.update('key1', updater)).resolves.toEqual({
        bar: 'baz',
      });

      expect(updater).toHaveBeenCalledWith('foo');
      await expect(getStateEntityOfKey('key1')).resolves.toEqual({
        [FIELD_STATE_ID]: stateId,
        [FIELD_STATE_KEY]: 'key1',
        [FIELD_STATE_DATA]: { value: { hello: { bar: 'baz' } } },
        [FIELD_CREATED_AT]: expect.any(Date),
        [FIELD_UPDATED_AT]: expect.any(Date),
      });
    });
  });
});
