import fs from 'fs';
import moxy from '@moxyjs/moxy';
import { tmpNameSync } from 'tmp';
import { FileStateController } from '../controller';

const delay = (t) => new Promise((resolve) => setTimeout(resolve, t));

const initialContent = `
{
  "channelStates": {
    "test.boo": {
      "key1": "boo",
      "key2": true
    }
  },
  "threadStates": {
    "test.foo": {
      "key1": "foo",
      "key2": 123
    }
  },
  "userStates": {
    "test.bar": {
      "key1": "bar",
      "key2": 456
    }
  },
  "globalStates": {
    "baz": {
      "key1": { "baz": true },
      "key2": [7, 8, 9]
    }
  }
}`;

const booChannel = {
  platform: 'test',
  uid: 'test.boo',
  uniqueIdentifier: { platform: 'test', id: 'boo' },
};
const fooThread = {
  platform: 'test',
  uid: 'test.foo',
  uniqueIdentifier: { platform: 'test', id: 'foo' },
};
const barUser = {
  platform: 'test',
  uid: 'test.bar',
  uniqueIdentifier: { platform: 'test', id: 'bar' },
};
const unknownThread = {
  platform: 'test',
  uid: 'test.unknown',
  uniqueIdentifier: { platform: 'test', id: 'unknown' },
};

describe('.get()', () => {
  test('get value from storage file', async () => {
    const tmpPath = tmpNameSync();
    fs.writeFileSync(tmpPath, initialContent);

    const controller = new FileStateController({ path: tmpPath });

    const channelState = controller.channelState(booChannel);
    await expect(channelState.get('key1')).resolves.toBe('boo');
    await expect(channelState.get('key2')).resolves.toBe(true);
    await expect(channelState.get('key3')).resolves.toBe(undefined);

    const fooThreadState = controller.threadState(fooThread);
    await expect(fooThreadState.get('key1')).resolves.toBe('foo');
    await expect(fooThreadState.get('key2')).resolves.toBe(123);
    await expect(fooThreadState.get('key3')).resolves.toBe(undefined);

    const barUserState = controller.userState(barUser);
    await expect(barUserState.get('key1')).resolves.toBe('bar');
    await expect(barUserState.get('key2')).resolves.toBe(456);
    await expect(barUserState.get('key3')).resolves.toBe(undefined);

    const bazGlobalState = controller.globalState('baz');
    await expect(bazGlobalState.get('key1')).resolves.toEqual({ baz: true });
    await expect(bazGlobalState.get('key2')).resolves.toEqual([7, 8, 9]);
    await expect(bazGlobalState.get('key3')).resolves.toBe(undefined);
  });

  test('when sotrage file is empty', async () => {
    const tmpPath = tmpNameSync();
    const controller = new FileStateController({ path: tmpPath });
    await expect(controller.threadState(fooThread).get('key')).resolves.toBe(
      undefined
    );
    await delay(20);
    expect(JSON.parse(fs.readFileSync(tmpPath, 'utf8'))).toMatchInlineSnapshot(`
      Object {
        "globalStates": Object {},
        "threadStates": Object {},
        "userStates": Object {},
      }
    `);
  });
});

describe('.getAll()', () => {
  test('get all values from storage file', async () => {
    const tmpPath = tmpNameSync();
    fs.writeFileSync(tmpPath, initialContent);

    const controller = new FileStateController({ path: tmpPath });

    await expect(controller.channelState(booChannel).getAll()).resolves
      .toMatchInlineSnapshot(`
                      Map {
                        "key1" => "boo",
                        "key2" => true,
                      }
                  `);
    await expect(controller.threadState(fooThread).getAll()).resolves
      .toMatchInlineSnapshot(`
                      Map {
                        "key1" => "foo",
                        "key2" => 123,
                      }
                  `);

    await expect(controller.userState(barUser).getAll()).resolves
      .toMatchInlineSnapshot(`
                      Map {
                        "key1" => "bar",
                        "key2" => 456,
                      }
                  `);
    await expect(controller.globalState('baz').getAll()).resolves
      .toMatchInlineSnapshot(`
                      Map {
                        "key1" => Object {
                          "baz": true,
                        },
                        "key2" => Array [
                          7,
                          8,
                          9,
                        ],
                      }
                  `);

    await expect(
      controller.threadState(unknownThread).getAll()
    ).resolves.toEqual(new Map());
  });

  test('when storage file is empty', async () => {
    const tmpPath = tmpNameSync();
    const controller = new FileStateController({ path: tmpPath });

    await expect(controller.threadState(fooThread).getAll()).resolves.toEqual(
      new Map()
    );
    await delay(20);
    expect(JSON.parse(fs.readFileSync(tmpPath, 'utf8'))).toMatchInlineSnapshot(`
      Object {
        "globalStates": Object {},
        "threadStates": Object {},
        "userStates": Object {},
      }
    `);
  });
});

describe('.keys()', () => {
  test('return keys from storage file', async () => {
    const tmpPath = tmpNameSync();
    fs.writeFileSync(tmpPath, initialContent);
    const controller = new FileStateController({ path: tmpPath });

    await expect(controller.channelState(booChannel).keys()).resolves.toEqual([
      'key1',
      'key2',
    ]);
    await expect(controller.threadState(fooThread).keys()).resolves.toEqual([
      'key1',
      'key2',
    ]);
    await expect(controller.userState(barUser).keys()).resolves.toEqual([
      'key1',
      'key2',
    ]);
    await expect(controller.globalState('baz').keys()).resolves.toEqual([
      'key1',
      'key2',
    ]);
    await expect(controller.threadState(unknownThread).keys()).resolves.toEqual(
      []
    );
  });

  test('when storage file is empty', async () => {
    const tmpPath = tmpNameSync();
    const controller = new FileStateController({ path: tmpPath });

    await expect(controller.threadState(fooThread).keys()).resolves.toEqual([]);
    await delay(20);
    expect(JSON.parse(fs.readFileSync(tmpPath, 'utf8'))).toMatchInlineSnapshot(`
      Object {
        "globalStates": Object {},
        "threadStates": Object {},
        "userStates": Object {},
      }
    `);
  });
});

describe('.set()', () => {
  test('write value to storage file', async () => {
    const tmpPath = tmpNameSync();
    fs.writeFileSync(tmpPath, initialContent);

    const controller = new FileStateController({ path: tmpPath });

    const booChannelState = controller.channelState(booChannel);
    await expect(booChannelState.set('key1', ['bar'])).resolves.toBe(true);
    await expect(booChannelState.get('key1')).resolves.toEqual(['bar']);

    const fooThreadState = controller.threadState(fooThread);
    await expect(fooThreadState.set('key1', 'bar')).resolves.toBe(true);
    await expect(fooThreadState.get('key1')).resolves.toBe('bar');

    const barUserState = controller.userState(barUser);
    await expect(barUserState.set('key3', 'bar')).resolves.toBe(false);
    await expect(barUserState.get('key3')).resolves.toBe('bar');

    const barGlobalState = controller.globalState('BAR');
    await expect(barGlobalState.set('key1', { bar: 'y' })).resolves.toBe(false);
    await expect(barGlobalState.get('key1')).resolves.toEqual({ bar: 'y' });

    await expect(barGlobalState.set('key1', { bar: 'n' })).resolves.toBe(true);
    await expect(barGlobalState.get('key1')).resolves.toEqual({ bar: 'n' });

    await delay(40);
    expect(JSON.parse(fs.readFileSync(tmpPath, 'utf8'))).toMatchInlineSnapshot(`
      Object {
        "channelStates": Object {
          "test.boo": Object {
            "key1": Array [
              "bar",
            ],
            "key2": true,
          },
        },
        "globalStates": Object {
          "BAR": Object {
            "key1": Object {
              "bar": "n",
            },
          },
          "baz": Object {
            "key1": Object {
              "baz": true,
            },
            "key2": Array [
              7,
              8,
              9,
            ],
          },
        },
        "threadStates": Object {
          "test.foo": Object {
            "key1": "bar",
            "key2": 123,
          },
        },
        "userStates": Object {
          "test.bar": Object {
            "key1": "bar",
            "key2": 456,
            "key3": "bar",
          },
        },
      }
    `);
  });

  test('write value when storage file is empty', async () => {
    const tmpPath = tmpNameSync();
    const controller = new FileStateController({ path: tmpPath });

    await expect(
      controller.threadState(fooThread).set('bar', 'baz')
    ).resolves.toBe(false);

    await delay(20);
    expect(JSON.parse(fs.readFileSync(tmpPath, 'utf8'))).toMatchInlineSnapshot(`
      Object {
        "globalStates": Object {},
        "threadStates": Object {
          "test.foo": Object {
            "bar": "baz",
          },
        },
        "userStates": Object {},
      }
    `);
  });
});

describe('.delete()', () => {
  test('delete value from storage file', async () => {
    const tmpPath = tmpNameSync();
    fs.writeFileSync(tmpPath, initialContent);

    const controller = new FileStateController({ path: tmpPath });

    const fooThreadState = controller.threadState(fooThread);
    await expect(fooThreadState.delete('key3')).resolves.toBe(false);
    await expect(fooThreadState.get('key3')).resolves.toBe(undefined);

    await expect(fooThreadState.delete('key2')).resolves.toBe(true);
    await expect(fooThreadState.get('key2')).resolves.toBe(undefined);

    await expect(fooThreadState.delete('key1')).resolves.toBe(true);
    await expect(fooThreadState.get('key1')).resolves.toBe(undefined);
    await expect(fooThreadState.delete('key1')).resolves.toBe(false);

    await expect(controller.userState(barUser).delete('key1')).resolves.toBe(
      true
    );
    await expect(
      controller.channelState(booChannel).delete('key3')
    ).resolves.toBe(false);

    await delay(20);
    expect(JSON.parse(fs.readFileSync(tmpPath, 'utf8'))).toMatchInlineSnapshot(`
      Object {
        "channelStates": Object {
          "test.boo": Object {
            "key1": "boo",
            "key2": true,
          },
        },
        "globalStates": Object {
          "baz": Object {
            "key1": Object {
              "baz": true,
            },
            "key2": Array [
              7,
              8,
              9,
            ],
          },
        },
        "threadStates": Object {},
        "userStates": Object {
          "test.bar": Object {
            "key2": 456,
          },
        },
      }
    `);
  });

  test('delete when storage file is empty', async () => {
    const tmpPath = tmpNameSync();
    const controller = new FileStateController({ path: tmpPath });

    await expect(controller.threadState(fooThread).delete('key')).resolves.toBe(
      false
    );
    await delay(20);
    expect(JSON.parse(fs.readFileSync(tmpPath, 'utf8'))).toMatchInlineSnapshot(`
      Object {
        "globalStates": Object {},
        "threadStates": Object {},
        "userStates": Object {},
      }
    `);
  });
});

describe('.clear()', () => {
  test('clear values from storage file', async () => {
    const tmpPath = tmpNameSync();
    fs.writeFileSync(tmpPath, initialContent);

    const controller = new FileStateController({ path: tmpPath });

    const booChannelState = controller.channelState(booChannel);
    await expect(booChannelState.clear()).resolves.toBe(2);
    await expect(booChannelState.get('key1')).resolves.toBe(undefined);
    await expect(booChannelState.get('key2')).resolves.toBe(undefined);

    const fooThreadState = controller.threadState(fooThread);
    await expect(fooThreadState.clear()).resolves.toBe(2);
    await expect(fooThreadState.get('key1')).resolves.toBe(undefined);

    const barUserState = controller.userState(barUser);
    await expect(barUserState.clear()).resolves.toBe(2);
    await expect(barUserState.get('key1')).resolves.toBe(undefined);

    await expect(controller.globalState('zab').clear()).resolves.toBe(0);

    await delay(20);
    expect(JSON.parse(fs.readFileSync(tmpPath, 'utf8'))).toMatchInlineSnapshot(`
      Object {
        "channelStates": Object {},
        "globalStates": Object {
          "baz": Object {
            "key1": Object {
              "baz": true,
            },
            "key2": Array [
              7,
              8,
              9,
            ],
          },
        },
        "threadStates": Object {},
        "userStates": Object {},
      }
    `);
  });

  test('clear when storage file is empty', async () => {
    const tmpPath = tmpNameSync();
    const controller = new FileStateController({ path: tmpPath });

    await expect(controller.threadState(fooThread).clear()).resolves.toBe(0);
    await delay(20);
    expect(JSON.parse(fs.readFileSync(tmpPath, 'utf8'))).toMatchInlineSnapshot(`
      Object {
        "globalStates": Object {},
        "threadStates": Object {},
        "userStates": Object {},
      }
    `);
  });
});

test('reflect content changes on storage file', async () => {
  const tmpPath = tmpNameSync();
  fs.writeFileSync(tmpPath, initialContent);

  const controller = new FileStateController({ path: tmpPath });

  const fooThreadState = controller.threadState(fooThread);

  await expect(fooThreadState.get('key1')).resolves.toBe('foo');
  await expect(fooThreadState.getAll()).resolves.toEqual(
    new Map<string, unknown>([
      ['key1', 'foo'],
      ['key2', 123],
    ])
  );

  fs.writeFileSync(
    tmpPath,
    `{
       "threadStates": {
         "test.foo": {
           "key1": "foooo",
           "key2": "baz"
         }
       }
     }`
  );

  await delay(20);
  await expect(fooThreadState.get('key1')).resolves.toBe('foooo');
  await expect(fooThreadState.getAll()).resolves.toEqual(
    new Map([
      ['key1', 'foooo'],
      ['key2', 'baz'],
    ])
  );
});

test('custom marshaler', async () => {
  const marshaler = moxy({
    marshal: (obj) => ({ hello: 'world', value: obj }),
    unmarshal: ({ value }) => value,
  });

  const tmpPath = tmpNameSync();
  fs.writeFileSync(
    tmpPath,
    `{
       "threadStates": {
         "test.foo": {
           "key1": {
             "hello": "world",
             "value": 123
           }
         }
       }
     }`
  );

  const controller = new FileStateController({ path: tmpPath }, marshaler);

  const fooState = controller.threadState(fooThread);

  await expect(fooState.get('key1')).resolves.toBe(123);
  expect(marshaler.unmarshal).toHaveBeenCalledWith({
    hello: 'world',
    value: 123,
  });

  await fooState.set('key2', 456);
  await delay(20);
  expect(marshaler.marshal).toHaveBeenCalledWith(456);

  await expect(fooState.update('key1', (v: number) => v + 666)).resolves.toBe(
    789
  );
  await delay(20);
  expect(marshaler.marshal).toHaveBeenCalledWith(789);

  await expect(fooState.getAll()).resolves.toEqual(
    new Map([
      ['key1', 789],
      ['key2', 456],
    ])
  );
  expect(JSON.parse(fs.readFileSync(tmpPath, 'utf8'))).toMatchInlineSnapshot(`
    Object {
      "threadStates": Object {
        "test.foo": Object {
          "key1": Object {
            "hello": "world",
            "value": 789,
          },
          "key2": Object {
            "hello": "world",
            "value": 456,
          },
        },
      },
    }
  `);
});

test('custom serializer', async () => {
  const serializer = moxy({
    stringify() {
      return '_UPDATED_MAGICALLY_ENCODED_DATA_';
    },
    parse() {
      return {
        threadStates: {
          'test.foo': {
            from: 'MAGIC',
          },
        },
      };
    },
  });

  const tmpPath = tmpNameSync();
  fs.writeFileSync(tmpPath, '_MAGICALLY_ENCODED_DATA_');

  const controller = new FileStateController(
    { path: tmpPath },
    undefined,
    serializer
  );

  const fooThreadState = controller.threadState(fooThread);
  await expect(fooThreadState.get('from')).resolves.toBe('MAGIC');
  expect(serializer.parse).toHaveBeenCalledWith('_MAGICALLY_ENCODED_DATA_');

  await expect(fooThreadState.set('is', 'magical')).resolves.toBe(false);
  await expect(fooThreadState.get('is')).resolves.toBe('magical');

  await delay(20);
  expect(fs.readFileSync(tmpPath, 'utf8')).toBe(
    '_UPDATED_MAGICALLY_ENCODED_DATA_'
  );
  expect(serializer.stringify).toHaveBeenCalledWith({
    threadStates: {
      'test.foo': { from: 'MAGIC', is: 'magical' },
    },
  });
});
