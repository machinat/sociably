/* eslint-disable no-await-in-loop */
import { Pool } from 'pg';
import moxy, { Mock, isMoxy } from '@moxyjs/moxy';
import {
  DEFAULT_STATE_TABLE_NAME,
  FIELD_STATE_TYPE,
  FIELD_STATE_PLATFORM,
  FIELD_STATE_KEY,
  FIELD_STATE_SCOPE_ID,
  FIELD_STATE_ID,
  FIELD_STATE_DATA,
} from '../constants';
import { PostgresStateController, PostgresStateAccessor } from '../controller';

const pgPool = moxy(new Pool({ connectionString: process.env.DATABASE_URL }), {
  mockMethod: false,
  includeProperties: ['query', 'connect'],
});
afterAll(async () => {
  await pgPool.end();
});

const clientQueryMock = new Mock();
pgPool.connect.mock.wrap(
  (connect) =>
    async function connectWithMoxiedClient(callback) {
      if (callback) {
        return connect.call(this, callback);
      }
      const client = await connect.call(this);
      if (!isMoxy(client.query)) {
        client.query = clientQueryMock.proxify(client.query);
      }
      return client;
    }
);

const marshaler = moxy({
  marshal: (x) => x,
  unmarshal: (x) => x,
});

const getIdenticalQueryCallsText = (queryCalls) =>
  queryCalls.reduce((queryText, { args: [query] }) => {
    const text = typeof query === 'string' ? query : query.text;
    if (queryText) {
      expect(text).toBe(queryText);
    }
    return text;
  }, null);
const getQueryCallsText = (queryCalls) =>
  queryCalls.map(({ args: [query] }) =>
    typeof query === 'string' ? query : query.text
  );
const getQueryCallsValues = (queryCalls) =>
  queryCalls.map(({ args: [{ values }] }) => values);

describe.each([
  ['default table', undefined, undefined],
  ['specified table', undefined, 'my_table'],
  ['specified schema & table', 'my_schema', 'my_table'],
])('%s', (_, schemaName, tableName) => {
  const controller = new PostgresStateController(
    pgPool,
    marshaler,
    schemaName,
    tableName
  );

  beforeAll(async () => {
    await controller.createTable();
  });

  afterAll(async () => {
    await controller.dropTable();
  });

  type StateTestCase = [
    string, // test name
    PostgresStateAccessor, // state object
    Record<string, unknown> // identifier fields in DB
  ];

  describe.each<StateTestCase>([
    [
      'channel state',
      controller.channelState({
        platform: 'test',
        uid: 'test.foo',
        uniqueIdentifier: { platform: 'test', id: 'foo' },
      }),
      {
        [FIELD_STATE_TYPE]: 'channel',
        [FIELD_STATE_PLATFORM]: 'test',
        [FIELD_STATE_SCOPE_ID]: '',
        [FIELD_STATE_ID]: 'foo',
      },
    ],
    [
      'channel state with scope id',
      controller.channelState({
        platform: 'test',
        uid: 'test.foo.1',
        uniqueIdentifier: {
          platform: 'test',
          scopeId: 'foo',
          id: 1,
        },
      }),
      {
        [FIELD_STATE_TYPE]: 'channel',
        [FIELD_STATE_PLATFORM]: 'test',
        [FIELD_STATE_SCOPE_ID]: 'foo',
        [FIELD_STATE_ID]: '1',
      },
    ],
    [
      'user state',
      controller.userState({
        platform: 'test',
        uid: 'test.foo',
        uniqueIdentifier: { platform: 'test', id: 'foo' },
      }),
      {
        [FIELD_STATE_TYPE]: 'user',
        [FIELD_STATE_PLATFORM]: 'test',
        [FIELD_STATE_SCOPE_ID]: '',
        [FIELD_STATE_ID]: 'foo',
      },
    ],
    [
      'user state with scope id',
      controller.userState({
        platform: 'test',
        uid: 'test.foo.1',
        uniqueIdentifier: { platform: 'test', scopeId: 'foo', id: 1 },
      }),
      {
        [FIELD_STATE_TYPE]: 'user',
        [FIELD_STATE_PLATFORM]: 'test',
        [FIELD_STATE_SCOPE_ID]: 'foo',
        [FIELD_STATE_ID]: '1',
      },
    ],
    [
      'global state',
      controller.globalState('foo'),
      {
        [FIELD_STATE_TYPE]: 'global',
        [FIELD_STATE_PLATFORM]: '',
        [FIELD_STATE_SCOPE_ID]: '',
        [FIELD_STATE_ID]: 'foo',
      },
    ],
  ])('%s', (__, state, identifierFields) => {
    const tableId = schemaName
      ? `"${schemaName}"."${tableName}"`
      : `"${tableName ?? DEFAULT_STATE_TABLE_NAME}"`;

    const insertStateEntity = (key, value) =>
      pgPool.query({
        text: `
          INSERT INTO ${tableId} (
            "${FIELD_STATE_KEY}", "${FIELD_STATE_DATA}",
            ${Object.keys(identifierFields)
              .map((name) => `"${name}"`)
              .join(', ')}
          ) VALUES ($1, $2, $3, $4, $5, $6)
        `,
        values: [key, { value }, ...Object.values(identifierFields)],
      });
    const getStateEntities = async () => {
      const result = await pgPool.query({
        text: `
            SELECT * FROM ${tableId} WHERE
            ${Object.keys(identifierFields)
              .map((k, i) => `"${k}"=$${i + 1}`)
              .join(' AND ')}
          `,
        values: Object.values(identifierFields),
      });
      return result.rows;
    };
    const getStateEntityOfKey = async (key) => {
      const entities = await getStateEntities();
      return entities.find(
        ({ [FIELD_STATE_KEY]: entityKey }) => key === entityKey
      );
    };

    beforeEach(async () => {
      await insertStateEntity('key2', 'foo');
      await insertStateEntity('key3', 123);
      await insertStateEntity('key4', { bar: 'baz' });
      await insertStateEntity('key5', [{ a: 0 }, { b: 1 }, { c: 2 }]);
      await insertStateEntity('key6', null);

      pgPool.mock.clear();
      clientQueryMock.clear();
      marshaler.mock.reset();
    });
    afterEach(async () => {
      await pgPool.query(`DELETE FROM ${tableId};`);
    });

    test('.get()', async () => {
      for (const [key, value] of [
        ['key1', undefined],
        ['key2', 'foo'],
        ['key3', 123],
        ['key4', { bar: 'baz' }],
        ['key5', [{ a: 0 }, { b: 1 }, { c: 2 }]],
        ['key6', null],
      ] as const) {
        await expect(state.get(key)).resolves.toEqual(value);
      }

      expect(
        getIdenticalQueryCallsText(pgPool.query.mock.calls)
      ).toMatchSnapshot();
      expect(getQueryCallsValues(pgPool.query.mock.calls)).toMatchSnapshot();
    });

    test('.set()', async () => {
      const cases = [
        ['key1', 'foo', false],
        ['key2', 'bar', true],
        ['key3', 456, true],
        ['key4', { bar: 'bae' }, true],
        ['key5', [1, 2, 3], true],
        ['key6', {}, true],
      ] as const;
      for (const [key, value, isUpdated] of cases) {
        await expect(state.set(key, value)).resolves.toBe(isUpdated);
      }

      expect(
        getIdenticalQueryCallsText(pgPool.query.mock.calls)
      ).toMatchSnapshot();
      expect(getQueryCallsValues(pgPool.query.mock.calls)).toMatchSnapshot();
    });

    describe('.update()', () => {
      it('update value', async () => {
        let lastQueryTexts;
        const allQueryValues: unknown[] = [];

        const cases = [
          ['key1', undefined, 'foo'],
          ['key2', 'foo', 'bar'],
          ['key3', 123, 456],
          ['key4', { bar: 'baz' }, { bar: 'bae' }],
          ['key5', [{ a: 0 }, { b: 1 }, { c: 2 }], [1, 2, 3]],
          ['key6', null, {}],
        ] as const;
        for (const [key, originalValue, newValue] of cases) {
          const updator = moxy(() => newValue);
          await expect(state.update(key, updator)).resolves.toEqual(newValue);

          expect(updator.mock).toHaveBeenCalledTimes(1);
          expect(updator.mock).toHaveBeenCalledWith(originalValue);

          const queryTexts = getQueryCallsText(clientQueryMock.calls);
          if (lastQueryTexts) {
            expect(queryTexts).toEqual(lastQueryTexts);
          } else {
            expect(queryTexts).toMatchSnapshot();
            lastQueryTexts = queryTexts;
          }
          allQueryValues.push(
            ...getQueryCallsValues(clientQueryMock.calls).filter(
              (values) => !!values
            )
          );
          clientQueryMock.clear();
        }
        expect(allQueryValues).toMatchSnapshot();

        await expect(getStateEntities()).resolves.toEqual(
          cases.map(([key, _originalValue, newValue]) => ({
            ...identifierFields,
            [FIELD_STATE_KEY]: key,
            [FIELD_STATE_DATA]: { value: newValue },
          }))
        );
      });

      it('delete entity if updater returns `undefined`', async () => {
        const updater = moxy(() => undefined);
        await expect(state.update('key2', updater)).resolves.toBe(undefined);

        expect(updater.mock).toHaveBeenCalledTimes(1);
        expect(updater.mock).toHaveBeenCalledWith('foo');

        expect(getQueryCallsText(clientQueryMock.calls)).toMatchSnapshot();
        expect(
          getQueryCallsValues(clientQueryMock.calls).filter(
            (values) => !!values
          )
        ).toMatchSnapshot();

        await expect(getStateEntityOfKey('key2')).resolves.toBe(undefined);
      });

      it('make no change if the new value is the same as old value by shallow comparison', async () => {
        let lastQueryTexts;
        const allQueryValues: unknown[] = [];

        const cases = [
          ['key2', 'foo'],
          ['key3', 123],
          ['key4', { bar: 'baz' }],
          ['key5', [{ a: 0 }, { b: 1 }, { c: 2 }]],
          ['key6', null],
        ] as const;

        for (const [key, value] of cases) {
          const updater = moxy((x) => x);
          await expect(state.update(key, updater)).resolves.toEqual(value);

          expect(updater.mock).toHaveBeenCalledTimes(1);
          expect(updater.mock).toHaveBeenCalledWith(value);

          const queryTexts = getQueryCallsText(clientQueryMock.calls);
          if (lastQueryTexts) {
            expect(queryTexts).toEqual(lastQueryTexts);
          } else {
            expect(queryTexts).toMatchSnapshot();
            lastQueryTexts = queryTexts;
          }
          allQueryValues.push(
            ...getQueryCallsValues(clientQueryMock.calls).filter(
              (values) => !!values
            )
          );
          clientQueryMock.clear();
        }
        expect(allQueryValues).toMatchSnapshot();

        await expect(getStateEntities()).resolves.toEqual(
          cases.map(([key, value]) => ({
            ...identifierFields,
            [FIELD_STATE_KEY]: key,
            [FIELD_STATE_DATA]: { value },
          }))
        );
      });
    });

    test('.delete()', async () => {
      for (const [key, isDeleted] of [
        ['key1', false],
        ['key2', true],
        ['key3', true],
        ['key4', true],
        ['key5', true],
        ['key6', true],
      ] as const) {
        await expect(state.delete(key)).resolves.toBe(isDeleted);
      }

      expect(
        getIdenticalQueryCallsText(pgPool.query.mock.calls)
      ).toMatchSnapshot();
      expect(getQueryCallsValues(pgPool.query.mock.calls)).toMatchSnapshot();

      await expect(getStateEntities()).resolves.toEqual([]);
    });

    test('.clear()', async () => {
      await expect(state.clear()).resolves.toBe(undefined);

      expect(
        getIdenticalQueryCallsText(pgPool.query.mock.calls)
      ).toMatchSnapshot();
      expect(getQueryCallsValues(pgPool.query.mock.calls)).toMatchSnapshot();

      await expect(getStateEntities()).resolves.toEqual([]);
    });

    test('.keys()', async () => {
      await expect(state.keys()).resolves.toEqual([
        'key2',
        'key3',
        'key4',
        'key5',
        'key6',
      ]);

      expect(
        getIdenticalQueryCallsText(pgPool.query.mock.calls)
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
        ])
      );

      expect(
        getIdenticalQueryCallsText(pgPool.query.mock.calls)
      ).toMatchSnapshot();
      expect(getQueryCallsValues(pgPool.query.mock.calls)).toMatchSnapshot();
    });

    test('custom marshaler', async () => {
      marshaler.marshal.mock.fake((value) => ({ hello: value }));
      marshaler.unmarshal.mock.fake(({ hello }) => hello);

      await expect(state.set('key1', 'foo')).resolves.toBe(false);
      await expect(state.get('key1')).resolves.toBe('foo');
      await expect(getStateEntityOfKey('key1')).resolves.toEqual({
        ...identifierFields,
        [FIELD_STATE_KEY]: 'key1',
        [FIELD_STATE_DATA]: { value: { hello: 'foo' } },
      });

      const updater = moxy(() => ({ bar: 'baz' }));
      await expect(state.update('key1', updater)).resolves.toEqual({
        bar: 'baz',
      });

      expect(updater).toHaveBeenCalledWith('foo');
      await expect(getStateEntityOfKey('key1')).resolves.toEqual({
        ...identifierFields,
        [FIELD_STATE_KEY]: 'key1',
        [FIELD_STATE_DATA]: { value: { hello: { bar: 'baz' } } },
      });
    });
  });
});
