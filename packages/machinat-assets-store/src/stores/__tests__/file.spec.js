import fs from 'fs';
import { tmpNameSync } from 'tmp';
import FileAssetStore from '../file';

test('#get() asset id from toml file', async () => {
  const tmpPath = tmpNameSync();
  fs.writeFileSync(
    tmpPath,
    `
[test.my_entity.some_resource]
key1 = 'foo'
key2 = 123

[test.my_entity.another_resource]
key1 = 'bar'
key2 = 456

[test.another_entity.some_resource]
key1 = 'baz'
key2 = 789
`
  );

  const fileStore = new FileAssetStore({ path: tmpPath });

  await expect(
    fileStore.get('test', 'my_entity', 'some_resource', 'key1')
  ).resolves.toBe('foo');

  await expect(
    fileStore.get('test', 'my_entity', 'some_resource', 'key2')
  ).resolves.toBe(123);

  await expect(
    fileStore.get('test', 'my_entity', 'another_resource', 'key1')
  ).resolves.toBe('bar');

  await expect(
    fileStore.get('test', 'another_entity', 'some_resource', 'key1')
  ).resolves.toBe('baz');

  await expect(
    fileStore.get('test', 'my_entity', 'some_resource', 'key3')
  ).resolves.toBe(undefined);

  await expect(
    fileStore.get('test', 'my_entity', 'empty_resource', 'key1')
  ).resolves.toBe(undefined);

  await expect(
    fileStore.get('test', 'entity_not_existed', 'some_resource', 'key1')
  ).resolves.toBe(undefined);
});

test('#list() assets of specific resource', async () => {
  const tmpPath = tmpNameSync();
  fs.writeFileSync(
    tmpPath,
    `
[test.my_entity.some_resource]
key1 = 'foo'
key2 = 123

[test.my_entity.another_resource]
key1 = 'bar'
key2 = 456

[test.another_entity.some_resource]
key1 = 'baz'
key2 = 789
`
  );

  const fileStore = new FileAssetStore({ path: tmpPath });

  let assets;

  assets = await fileStore.list('test', 'my_entity', 'some_resource');
  expect(assets).toBeInstanceOf(Map);
  expect(assets.size).toBe(2);
  expect(assets.get('key1')).toBe('foo');
  expect(assets.get('key2')).toBe(123);

  assets = await fileStore.list('test', 'my_entity', 'another_resource');
  expect(assets.size).toBe(2);
  expect(assets.get('key1')).toBe('bar');
  expect(assets.get('key2')).toBe(456);

  assets = await fileStore.list('test', 'another_entity', 'some_resource');
  expect(assets.size).toBe(2);
  expect(assets.get('key1')).toBe('baz');
  expect(assets.get('key2')).toBe(789);

  assets = await fileStore.list('test', 'my_entity', 'empty_resource');
  expect(assets).toBe(null);

  assets = await fileStore.list('test', 'empty_entity', 'some_resource');
  expect(assets).toBe(null);
});

test('#set() asset id to file with toml format', async () => {
  const tmpPath = tmpNameSync();
  fs.writeFileSync(
    tmpPath,
    `
[test.my_entity.some_resource]
key1 = 'foo'
key2 = 123
`
  );

  const fileStore = new FileAssetStore({ path: tmpPath });

  await expect(
    fileStore.set('test', 'my_entity', 'some_resource', 'key3', 'bar')
  ).resolves.toBe(false);

  expect(fs.readFileSync(tmpPath, 'utf8')).toMatchInlineSnapshot(`
        "[test.my_entity.some_resource]
        key1 = \\"foo\\"
        key2 = 123
        key3 = \\"bar\\"
        "
    `);

  await expect(
    fileStore.set('test', 'my_entity', 'some_resource', 'key1', 'bar')
  ).resolves.toBe(true);
  expect(fs.readFileSync(tmpPath, 'utf8')).toMatchInlineSnapshot(`
        "[test.my_entity.some_resource]
        key1 = \\"bar\\"
        key2 = 123
        key3 = \\"bar\\"
        "
    `);

  await expect(
    fileStore.set('test', 'my_entity', 'another_resource', 'key1', 'bar')
  ).resolves.toBe(false);
  expect(fs.readFileSync(tmpPath, 'utf8')).toMatchInlineSnapshot(`
    "[test.my_entity.some_resource]
    key1 = \\"bar\\"
    key2 = 123
    key3 = \\"bar\\"

    [test.my_entity.another_resource]
    key1 = \\"bar\\"
    "
  `);

  await expect(
    fileStore.set('test', 'another_entity', 'some_resource', 'key1', 'baz')
  ).resolves.toBe(false);
  expect(fs.readFileSync(tmpPath, 'utf8')).toMatchInlineSnapshot(`
    "[test.my_entity.some_resource]
    key1 = \\"bar\\"
    key2 = 123
    key3 = \\"bar\\"

    [test.my_entity.another_resource]
    key1 = \\"bar\\"

    [test.another_entity.some_resource]
    key1 = \\"baz\\"
    "
  `);
});

test('#delete() stored asset from toml file', async () => {
  const tmpPath = tmpNameSync();
  fs.writeFileSync(
    tmpPath,
    `
[test.my_entity.some_resource]
key1 = 'foo'
key2 = 123

[test.my_entity.another_resource]
key1 = 'bar'
`
  );

  const fileStore = new FileAssetStore({ path: tmpPath });

  await expect(
    fileStore.delete('test', 'my_entity', 'some_resource', 'key3')
  ).resolves.toBe(false);

  await expect(
    fileStore.delete('test', 'my_entity', 'some_resource', 'key2')
  ).resolves.toBe(true);

  expect(fs.readFileSync(tmpPath, 'utf8')).toMatchInlineSnapshot(`
        "[test.my_entity.some_resource]
        key1 = \\"foo\\"

        [test.my_entity.another_resource]
        key1 = \\"bar\\"
        "
    `);

  await expect(
    fileStore.delete('test', 'my_entity', 'some_resource', 'key1')
  ).resolves.toBe(true);
  expect(fs.readFileSync(tmpPath, 'utf8')).toMatchInlineSnapshot(`
        "[test.my_entity]
        some_resource = { }

          [test.my_entity.another_resource]
          key1 = \\"bar\\"
        "
    `);

  await expect(
    fileStore.delete('test', 'my_entity', 'empty_resource', 'key1')
  ).resolves.toBe(false);

  await expect(
    fileStore.delete('test', 'empty_entity', 'some_resource', 'key1')
  ).resolves.toBe(false);

  await expect(
    fileStore.delete('test', 'my_entity', 'another_resource', 'key1')
  ).resolves.toBe(true);
  expect(fs.readFileSync(tmpPath, 'utf8')).toMatchInlineSnapshot(`
    "[test.my_entity]
    some_resource = { }
    another_resource = { }
    "
  `);
});

test('#deleteById() from toml file', async () => {
  const tmpPath = tmpNameSync();
  fs.writeFileSync(
    tmpPath,
    `
[test.my_entity.some_resource]
key1 = 'foo'
key2 = 123

[test.my_entity.another_resource]
key1 = 'bar'
`
  );

  const fileStore = new FileAssetStore({ path: tmpPath });

  await expect(
    fileStore.deleteById('test', 'my_entity', 'some_resource', 123)
  ).resolves.toBe(true);

  expect(fs.readFileSync(tmpPath, 'utf8')).toMatchInlineSnapshot(`
        "[test.my_entity.some_resource]
        key1 = \\"foo\\"

        [test.my_entity.another_resource]
        key1 = \\"bar\\"
        "
    `);

  await expect(
    fileStore.deleteById('test', 'my_entity', 'some_resource', 'foo')
  ).resolves.toBe(true);
  expect(fs.readFileSync(tmpPath, 'utf8')).toMatchInlineSnapshot(`
        "[test.my_entity]
        some_resource = { }

          [test.my_entity.another_resource]
          key1 = \\"bar\\"
        "
    `);

  await expect(
    fileStore.deleteById('test', 'my_entity', 'some_resource', 'bar')
  ).resolves.toBe(false);

  await expect(
    fileStore.deleteById('test', 'my_entity', 'empty_resource', 'foo')
  ).resolves.toBe(false);

  await expect(
    fileStore.deleteById('test', 'my_entity', 'another_resource', 'bar')
  ).resolves.toBe(true);
  expect(fs.readFileSync(tmpPath, 'utf8')).toMatchInlineSnapshot(`
    "[test.my_entity]
    some_resource = { }
    another_resource = { }
    "
  `);
});
