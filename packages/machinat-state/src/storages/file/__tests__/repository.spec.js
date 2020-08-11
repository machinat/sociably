import fs from 'fs';
import moxy from '@moxyjs/moxy';
import { tmpNameSync } from 'tmp';
import FileRepository from '../repository';

const delay = (t) => new Promise((resolve) => setTimeout(resolve, t));

describe('#get()', () => {
  test('get value from storage file', async () => {
    const tmpPath = tmpNameSync();
    fs.writeFileSync(
      tmpPath,
      `{
         "my_resource": {
           "key1": "foo",
           "key2": 123
         },
         "another_resource": {
           "key1": "bar",
           "key2": 456
         },
         "some_resource": {
           "key1": { "baz": true },
           "key2": [7, 8, 9]
         }
       }`
    );

    const repo = new FileRepository({ path: tmpPath });

    await expect(repo.get('my_resource', 'key1')).resolves.toBe('foo');
    await expect(repo.get('my_resource', 'key2')).resolves.toBe(123);

    await expect(repo.get('another_resource', 'key1')).resolves.toBe('bar');
    await expect(repo.get('another_resource', 'key1')).resolves.toBe('bar');

    await expect(repo.get('some_resource', 'key1')).resolves.toEqual({
      baz: true,
    });
    await expect(repo.get('some_resource', 'key2')).resolves.toEqual([7, 8, 9]);

    await expect(repo.get('some_resource', 'key3')).resolves.toBe(undefined);
    await expect(repo.get('empty_resource', 'key1')).resolves.toBe(undefined);
  });

  test('when sotrage file is empty', async () => {
    const tmpPath = tmpNameSync();
    const repo = new FileRepository({ path: tmpPath });
    await expect(repo.get('my_resource', 'key')).resolves.toBe(undefined);
  });
});

describe('#getAll()', () => {
  test('get all values from storage file', async () => {
    const tmpPath = tmpNameSync();
    fs.writeFileSync(
      tmpPath,
      `{
       "my_resource": {
         "key1": "foo",
         "key2": 123
       },
       "another_resource": {
         "key1": "bar",
         "key2": 456
       },
       "some_resource": {
         "key1": { "baz": true },
         "key2": [7, 8, 9]
       }
     }`
    );

    const repo = new FileRepository({ path: tmpPath });

    await expect(repo.getAll('my_resource')).resolves.toMatchInlineSnapshot(`
          Map {
            "key1" => "foo",
            "key2" => 123,
          }
        `);

    await expect(repo.getAll('another_resource')).resolves
      .toMatchInlineSnapshot(`
          Map {
            "key1" => "bar",
            "key2" => 456,
          }
        `);

    await expect(repo.getAll('some_resource')).resolves.toMatchInlineSnapshot(`
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

    await expect(repo.getAll('empty_resource')).resolves.toBe(null);
  });

  test('when storage file is empty', async () => {
    const tmpPath = tmpNameSync();
    const repo = new FileRepository({ path: tmpPath });

    await expect(repo.getAll('my_resource')).resolves.toBe(null);
  });
});

describe('#set()', () => {
  test('write value to storage file', async () => {
    const tmpPath = tmpNameSync();
    fs.writeFileSync(
      tmpPath,
      `{
         "my_resource": {
           "key1": "foo",
           "key2": 123
         }
       }`
    );

    const repo = new FileRepository({ path: tmpPath });

    await expect(repo.set('my_resource', 'key3', 'bar')).resolves.toBe(false);
    await expect(repo.get('my_resource', 'key3')).resolves.toBe('bar');

    await delay(20);
    expect(JSON.parse(fs.readFileSync(tmpPath, 'utf8'))).toEqual({
      my_resource: {
        key1: 'foo',
        key2: 123,
        key3: 'bar',
      },
    });

    await expect(repo.set('my_resource', 'key1', 'bar')).resolves.toBe(true);
    await expect(repo.get('my_resource', 'key1')).resolves.toBe('bar');

    await delay(20);
    expect(JSON.parse(fs.readFileSync(tmpPath, 'utf8'))).toEqual({
      my_resource: {
        key1: 'bar',
        key2: 123,
        key3: 'bar',
      },
    });

    await expect(
      repo.set('another_resource', 'key1', { bar: 'yes' })
    ).resolves.toBe(false);
    await expect(repo.get('another_resource', 'key1')).resolves.toEqual({
      bar: 'yes',
    });

    await delay(20);
    expect(JSON.parse(fs.readFileSync(tmpPath, 'utf8'))).toEqual({
      my_resource: {
        key1: 'bar',
        key2: 123,
        key3: 'bar',
      },
      another_resource: {
        key1: { bar: 'yes' },
      },
    });

    await expect(
      repo.set('another_resource', 'key1', { bar: false })
    ).resolves.toBe(true);
    await expect(repo.get('another_resource', 'key1')).resolves.toEqual({
      bar: false,
    });

    await delay(20);
    expect(JSON.parse(fs.readFileSync(tmpPath, 'utf8'))).toEqual({
      my_resource: {
        key1: 'bar',
        key2: 123,
        key3: 'bar',
      },
      another_resource: {
        key1: { bar: false },
      },
    });
  });

  test('write value when storage file is empty', async () => {
    const tmpPath = tmpNameSync();
    const repo = new FileRepository({ path: tmpPath });

    await expect(repo.set('my_resource', 'foo', 'bar')).resolves.toBe(false);

    await delay(20);
    expect(JSON.parse(fs.readFileSync(tmpPath, 'utf8'))).toEqual({
      my_resource: {
        foo: 'bar',
      },
    });
  });
});

describe('#delete()', () => {
  test('delete value from storage file', async () => {
    const tmpPath = tmpNameSync();
    fs.writeFileSync(
      tmpPath,
      `{
         "my_resource": {
           "key1": "foo",
           "key2": 123
         },
         "another_resource": {
           "key1": "bar"
         }
       }`
    );

    const repo = new FileRepository({ path: tmpPath });

    await expect(repo.delete('my_resource', 'key3')).resolves.toBe(false);
    await expect(repo.get('my_resource', 'key3')).resolves.toBe(undefined);

    await expect(repo.delete('my_resource', 'key2')).resolves.toBe(true);
    await expect(repo.get('my_resource', 'key2')).resolves.toBe(undefined);

    await delay(20);
    expect(JSON.parse(fs.readFileSync(tmpPath, 'utf8'))).toEqual({
      my_resource: {
        key1: 'foo',
      },
      another_resource: {
        key1: 'bar',
      },
    });

    await expect(repo.delete('my_resource', 'key1')).resolves.toBe(true);
    await expect(repo.get('my_resource', 'key1')).resolves.toBe(undefined);

    await delay(20);
    expect(JSON.parse(fs.readFileSync(tmpPath, 'utf8'))).toEqual({
      another_resource: {
        key1: 'bar',
      },
    });

    await expect(repo.delete('empty_resource', 'key1')).resolves.toBe(false);
    await expect(repo.delete('another_resource', 'key1')).resolves.toBe(true);

    await delay(20);
    expect(JSON.parse(fs.readFileSync(tmpPath, 'utf8'))).toEqual({});
  });

  test('delete when storage file is empty', async () => {
    const tmpPath = tmpNameSync();
    const repo = new FileRepository({ path: tmpPath });

    await expect(repo.delete('my_resource', 'key')).resolves.toBe(false);
  });
});

describe('#clear()', () => {
  test('clear values from storage file', async () => {
    const tmpPath = tmpNameSync();
    fs.writeFileSync(
      tmpPath,
      `{
         "my_resource": {
           "key1": "foo",
           "key2": 123
         },
         "another_resource": {
           "key1": "bar"
         }
       }`
    );

    const repo = new FileRepository({ path: tmpPath });

    await expect(repo.clear('my_resource')).resolves.toBe(undefined);
    await expect(repo.get('my_resource', 'key1')).resolves.toBe(undefined);

    await delay(20);
    expect(JSON.parse(fs.readFileSync(tmpPath, 'utf8'))).toEqual({
      another_resource: {
        key1: 'bar',
      },
    });

    await expect(repo.clear('empty_resource')).resolves.toBe(undefined);
    await expect(repo.clear('another_resource')).resolves.toBe(undefined);
    await expect(repo.get('another_resource', 'key1')).resolves.toBe(undefined);

    await delay(20);
    expect(JSON.parse(fs.readFileSync(tmpPath, 'utf8'))).toEqual({});
  });

  test('clear when storage file is empty', async () => {
    const tmpPath = tmpNameSync();
    const repo = new FileRepository({ path: tmpPath });

    await expect(repo.clear('my_resource')).resolves.toBe(undefined);
  });
});

test('reflect content changes on storage file', async () => {
  const tmpPath = tmpNameSync();
  fs.writeFileSync(
    tmpPath,
    `{
      "my_resource": {
        "key1": "foo",
        "key2": "bar"
       }
     }`
  );

  const repo = new FileRepository({ path: tmpPath });

  await expect(repo.get('my_resource', 'key1')).resolves.toBe('foo');
  await expect(repo.getAll('my_resource')).resolves.toEqual(
    new Map([
      ['key1', 'foo'],
      ['key2', 'bar'],
    ])
  );

  fs.writeFileSync(
    tmpPath,
    `{
      "my_resource": {
        "key1": "foooo",
        "key2": "baz"
       }
     }`
  );

  await delay(20);
  await expect(repo.get('my_resource', 'key1')).resolves.toBe('foooo');
  await expect(repo.getAll('my_resource')).resolves.toEqual(
    new Map([
      ['key1', 'foooo'],
      ['key2', 'baz'],
    ])
  );
});

test('custom serielizer', async () => {
  const serializer = moxy({
    stringify() {
      return '_UPDATED_MAGICALLY_ENCODED_DATA_';
    },
    parse() {
      return {
        my_resource: {
          from: 'MAGIC',
        },
      };
    },
  });

  const tmpPath = tmpNameSync();
  fs.writeFileSync(tmpPath, '_MAGICALLY_ENCODED_DATA_');

  const repo = new FileRepository({ path: tmpPath }, serializer);

  await expect(repo.get('my_resource', 'from')).resolves.toBe('MAGIC');
  expect(serializer.parse.mock).toHaveBeenCalledWith(
    '_MAGICALLY_ENCODED_DATA_'
  );

  await expect(repo.set('my_resource', 'is', 'magical')).resolves.toBe(false);
  await expect(repo.get('my_resource', 'is')).resolves.toBe('magical');

  await delay(20);
  expect(fs.readFileSync(tmpPath, 'utf8')).toBe(
    '_UPDATED_MAGICALLY_ENCODED_DATA_'
  );
  expect(serializer.stringify.mock).toHaveBeenCalledWith({
    my_resource: { from: 'MAGIC', is: 'magical' },
  });
});
