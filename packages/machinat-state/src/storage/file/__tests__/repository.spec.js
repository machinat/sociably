import fs from 'fs';
import { tmpNameSync } from 'tmp';
import FileRepository from '../repository';

test('#get()', async () => {
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

test('#getAll()', async () => {
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

  await expect(repo.getAll('another_resource')).resolves.toMatchInlineSnapshot(`
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

test('#set()', async () => {
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
  expect(JSON.parse(fs.readFileSync(tmpPath, 'utf8'))).toEqual({
    my_resource: {
      key1: 'foo',
      key2: 123,
      key3: 'bar',
    },
  });

  await expect(repo.set('my_resource', 'key1', 'bar')).resolves.toBe(true);
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

test('#delete()', async () => {
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
  await expect(repo.delete('my_resource', 'key2')).resolves.toBe(true);

  expect(JSON.parse(fs.readFileSync(tmpPath, 'utf8'))).toEqual({
    my_resource: {
      key1: 'foo',
    },
    another_resource: {
      key1: 'bar',
    },
  });

  await expect(repo.delete('my_resource', 'key1')).resolves.toBe(true);
  expect(JSON.parse(fs.readFileSync(tmpPath, 'utf8'))).toEqual({
    another_resource: {
      key1: 'bar',
    },
  });

  await expect(repo.delete('empty_resource', 'key1')).resolves.toBe(false);
  await expect(repo.delete('another_resource', 'key1')).resolves.toBe(true);
  expect(JSON.parse(fs.readFileSync(tmpPath, 'utf8'))).toEqual({});
});

test('#clear()', async () => {
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

  expect(JSON.parse(fs.readFileSync(tmpPath, 'utf8'))).toEqual({
    another_resource: {
      key1: 'bar',
    },
  });

  await expect(repo.clear('empty_resource')).resolves.toBe(undefined);
  await expect(repo.clear('another_resource')).resolves.toBe(undefined);
  expect(JSON.parse(fs.readFileSync(tmpPath, 'utf8'))).toEqual({});
});
