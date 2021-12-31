import fs from 'fs';
import moxy from '@moxyjs/moxy';
import { tmpNameSync } from 'tmp';
import { FileStateController } from '../controller';

const delay = (t) => new Promise((resolve) => setTimeout(resolve, t));

const initialContent = `
{
  "channelStates": {
    "foo": {
      "key1": "foo",
      "key2": 123
    }
  },
  "userStates": {
    "bar": {
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

const fooChannel = { platform: 'test', uid: 'foo' };
const barUser = { platform: 'test', uid: 'bar' };

describe('.get()', () => {
  test('get value from storage file', async () => {
    const tmpPath = tmpNameSync();
    fs.writeFileSync(tmpPath, initialContent);

    const controller = new FileStateController({ path: tmpPath });

    const fooChannelState = controller.channelState(fooChannel);
    await expect(fooChannelState.get('key1')).resolves.toBe('foo');
    await expect(fooChannelState.get('key2')).resolves.toBe(123);
    await expect(fooChannelState.get('key3')).resolves.toBe(undefined);

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
    await expect(
      controller.channelState({ platform: 'test', uid: 'foo' }).get('key')
    ).resolves.toBe(undefined);
    await delay(20);
    expect(JSON.parse(fs.readFileSync(tmpPath, 'utf8'))).toMatchInlineSnapshot(`
      Object {
        "channelStates": Object {},
        "globalStates": Object {},
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

    await expect(controller.channelState(fooChannel).getAll()).resolves
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
      controller.channelState({ platform: 'test', uid: 'unknown' }).getAll()
    ).resolves.toEqual(new Map());
  });

  test('when storage file is empty', async () => {
    const tmpPath = tmpNameSync();
    const controller = new FileStateController({ path: tmpPath });

    await expect(controller.channelState(fooChannel).getAll()).resolves.toEqual(
      new Map()
    );
    await delay(20);
    expect(JSON.parse(fs.readFileSync(tmpPath, 'utf8'))).toMatchInlineSnapshot(`
      Object {
        "channelStates": Object {},
        "globalStates": Object {},
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

    await expect(controller.channelState(fooChannel).keys()).resolves.toEqual([
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
    await expect(
      controller.channelState({ platform: 'test', uid: 'unknown' }).keys()
    ).resolves.toEqual([]);
  });

  test('when storage file is empty', async () => {
    const tmpPath = tmpNameSync();
    const controller = new FileStateController({ path: tmpPath });

    await expect(controller.channelState(fooChannel).keys()).resolves.toEqual(
      []
    );
    await delay(20);
    expect(JSON.parse(fs.readFileSync(tmpPath, 'utf8'))).toMatchInlineSnapshot(`
      Object {
        "channelStates": Object {},
        "globalStates": Object {},
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

    const fooChannelState = controller.channelState(fooChannel);
    await expect(fooChannelState.set('key1', 'bar')).resolves.toBe(true);
    await expect(fooChannelState.get('key1')).resolves.toBe('bar');

    const barUserState = controller.userState(barUser);
    await expect(barUserState.set('key3', 'bar')).resolves.toBe(false);
    await expect(barUserState.get('key3')).resolves.toBe('bar');

    const barGlobalState = controller.globalState('bar');
    await expect(barGlobalState.set('key1', { bar: 'yes' })).resolves.toBe(
      false
    );
    await expect(barGlobalState.get('key1')).resolves.toEqual({
      bar: 'yes',
    });

    await expect(barGlobalState.set('key1', { bar: false })).resolves.toBe(
      true
    );
    await expect(barGlobalState.get('key1')).resolves.toEqual({
      bar: false,
    });

    await delay(40);
    expect(JSON.parse(fs.readFileSync(tmpPath, 'utf8'))).toMatchInlineSnapshot(`
      Object {
        "channelStates": Object {
          "foo": Object {
            "key1": "bar",
            "key2": 123,
          },
        },
        "globalStates": Object {
          "bar": Object {
            "key1": Object {
              "bar": false,
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
        "userStates": Object {
          "bar": Object {
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
      controller.channelState(fooChannel).set('bar', 'baz')
    ).resolves.toBe(false);

    await delay(20);
    expect(JSON.parse(fs.readFileSync(tmpPath, 'utf8'))).toMatchInlineSnapshot(`
      Object {
        "channelStates": Object {
          "foo": Object {
            "bar": "baz",
          },
        },
        "globalStates": Object {},
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

    const fooChannelState = controller.channelState(fooChannel);
    await expect(fooChannelState.delete('key3')).resolves.toBe(false);
    await expect(fooChannelState.get('key3')).resolves.toBe(undefined);

    await expect(fooChannelState.delete('key2')).resolves.toBe(true);
    await expect(fooChannelState.get('key2')).resolves.toBe(undefined);

    await expect(fooChannelState.delete('key1')).resolves.toBe(true);
    await expect(fooChannelState.get('key1')).resolves.toBe(undefined);
    await expect(fooChannelState.delete('key1')).resolves.toBe(false);

    await expect(controller.userState(barUser).delete('key1')).resolves.toBe(
      true
    );

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
        "userStates": Object {
          "bar": Object {
            "key2": 456,
          },
        },
      }
    `);
  });

  test('delete when storage file is empty', async () => {
    const tmpPath = tmpNameSync();
    const controller = new FileStateController({ path: tmpPath });

    await expect(
      controller.channelState(fooChannel).delete('key')
    ).resolves.toBe(false);
    await delay(20);
    expect(JSON.parse(fs.readFileSync(tmpPath, 'utf8'))).toMatchInlineSnapshot(`
      Object {
        "channelStates": Object {},
        "globalStates": Object {},
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

    const fooChannelState = controller.channelState(fooChannel);
    await expect(fooChannelState.clear()).resolves.toBe(2);
    await expect(fooChannelState.get('key1')).resolves.toBe(undefined);

    const barUserState = controller.userState(barUser);
    await expect(barUserState.clear()).resolves.toBe(2);
    await expect(barUserState.get('key1')).resolves.toBe(undefined);

    await expect(controller.globalState('zab').clear()).resolves.toBe(0);

    await delay(20);
    expect(JSON.parse(fs.readFileSync(tmpPath, 'utf8'))).toMatchInlineSnapshot(`
      Object {
        "channelStates": Object {
          "foo": Object {},
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
        "userStates": Object {
          "bar": Object {},
        },
      }
    `);
  });

  test('clear when storage file is empty', async () => {
    const tmpPath = tmpNameSync();
    const controller = new FileStateController({ path: tmpPath });

    await expect(controller.channelState(fooChannel).clear()).resolves.toBe(0);
    await delay(20);
    expect(JSON.parse(fs.readFileSync(tmpPath, 'utf8'))).toMatchInlineSnapshot(`
      Object {
        "channelStates": Object {},
        "globalStates": Object {},
        "userStates": Object {},
      }
    `);
  });
});

test('reflect content changes on storage file', async () => {
  const tmpPath = tmpNameSync();
  fs.writeFileSync(tmpPath, initialContent);

  const controller = new FileStateController({ path: tmpPath });

  const fooChannelState = controller.channelState(fooChannel);

  await expect(fooChannelState.get('key1')).resolves.toBe('foo');
  await expect(fooChannelState.getAll()).resolves.toEqual(
    new Map<string, any>([
      ['key1', 'foo'],
      ['key2', 123],
    ])
  );

  fs.writeFileSync(
    tmpPath,
    `{
       "channelStates": {
         "foo": {
           "key1": "foooo",
           "key2": "baz"
         }
       }
     }`
  );

  await delay(20);
  await expect(fooChannelState.get('key1')).resolves.toBe('foooo');
  await expect(fooChannelState.getAll()).resolves.toEqual(
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
       "channelStates": {
         "foo": {
           "key1": {
             "hello": "world",
             "value": 123
           }
         }
       }
     }`
  );

  const controller = new FileStateController({ path: tmpPath }, marshaler);

  const fooState = controller.channelState(fooChannel);

  await expect(fooState.get('key1')).resolves.toBe(123);
  expect(marshaler.unmarshal.mock).toHaveBeenCalledWith({
    hello: 'world',
    value: 123,
  });

  await fooState.set('key2', 456);
  await delay(20);
  expect(marshaler.marshal.mock).toHaveBeenCalledWith(456);

  await expect(fooState.update('key1', (v: any) => v + 666)).resolves.toBe(789);
  await delay(20);
  expect(marshaler.marshal.mock).toHaveBeenCalledWith(789);

  await expect(fooState.getAll()).resolves.toEqual(
    new Map([
      ['key1', 789],
      ['key2', 456],
    ])
  );
  expect(JSON.parse(fs.readFileSync(tmpPath, 'utf8'))).toMatchInlineSnapshot(`
    Object {
      "channelStates": Object {
        "foo": Object {
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
        channelStates: {
          foo: {
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

  const fooChannelState = controller.channelState(fooChannel);
  await expect(fooChannelState.get('from')).resolves.toBe('MAGIC');
  expect(serializer.parse.mock).toHaveBeenCalledWith(
    '_MAGICALLY_ENCODED_DATA_'
  );

  await expect(fooChannelState.set('is', 'magical')).resolves.toBe(false);
  await expect(fooChannelState.get('is')).resolves.toBe('magical');

  await delay(20);
  expect(fs.readFileSync(tmpPath, 'utf8')).toBe(
    '_UPDATED_MAGICALLY_ENCODED_DATA_'
  );
  expect(serializer.stringify.mock).toHaveBeenCalledWith({
    channelStates: {
      foo: { from: 'MAGIC', is: 'magical' },
    },
  });
});
