import fs from 'fs';
import FileAssetStore from '../fileStore';

jest.mock('fs');

beforeEach(() => {
  fs.mock.reset();
});

it('read toml format of stored assets from file', async () => {
  const fileStore = new FileAssetStore({ path: './foo' });

  fs.readFile.mock.fake((path, opts, cb) => {
    cb(
      null,
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
  });

  await expect(
    fileStore.getAsset('test', 'my_entity', 'some_resource', 'key1')
  ).resolves.toBe('foo');

  expect(fs.readFile.mock).toHaveBeenCalledTimes(1);
  expect(fs.readFile.mock).toHaveBeenCalledWith(
    './foo',
    'utf8',
    expect.any(Function)
  );

  await expect(
    fileStore.getAsset('test', 'my_entity', 'some_resource', 'key2')
  ).resolves.toBe(123);

  await expect(
    fileStore.getAsset('test', 'my_entity', 'another_resource', 'key1')
  ).resolves.toBe('bar');

  await expect(
    fileStore.getAsset('test', 'another_entity', 'some_resource', 'key1')
  ).resolves.toBe('baz');

  await expect(
    fileStore.getAsset('test', 'my_entity', 'some_resource', 'key3')
  ).resolves.toBe(undefined);

  await expect(
    fileStore.getAsset('test', 'my_entity', 'empty_resource', 'key1')
  ).resolves.toBe(undefined);

  await expect(
    fileStore.getAsset('test', 'entity_not_existed', 'some_resource', 'key1')
  ).resolves.toBe(undefined);

  expect(fs.readFile.mock).toHaveBeenCalledTimes(7);
});

it('list assets of specific resource', async () => {
  const fileStore = new FileAssetStore({ path: './foo' });

  fs.readFile.mock.fake((path, opts, cb) => {
    cb(
      null,
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
  });

  let assets;

  assets = await fileStore.listAssets('test', 'my_entity', 'some_resource');
  expect(assets).toBeInstanceOf(Map);
  expect(assets.size).toBe(2);
  expect(assets.get('key1')).toBe('foo');
  expect(assets.get('key2')).toBe(123);

  expect(fs.readFile.mock).toHaveBeenCalledTimes(1);
  expect(fs.readFile.mock).toHaveBeenCalledWith(
    './foo',
    'utf8',
    expect.any(Function)
  );

  assets = await fileStore.listAssets('test', 'my_entity', 'another_resource');
  expect(assets.size).toBe(2);
  expect(assets.get('key1')).toBe('bar');
  expect(assets.get('key2')).toBe(456);

  assets = await fileStore.listAssets(
    'test',
    'another_entity',
    'some_resource'
  );
  expect(assets.size).toBe(2);
  expect(assets.get('key1')).toBe('baz');
  expect(assets.get('key2')).toBe(789);

  assets = await fileStore.listAssets('test', 'my_entity', 'empty_resource');
  expect(assets).toBe(null);

  assets = await fileStore.listAssets('test', 'empty_entity', 'some_resource');
  expect(assets).toBe(null);

  expect(fs.readFile.mock).toHaveBeenCalledTimes(5);
});

it('write toml format of stored assets to file', async () => {
  const fileStore = new FileAssetStore({ path: './foo' });

  fs.readFile.mock.fake((path, opts, cb) => {
    cb(
      null,
      `
[test.my_entity.some_resource]
key1 = 'foo'
key2 = 123
    `
    );
  });

  await expect(
    fileStore.setAsset('test', 'my_entity', 'some_resource', 'key3', 'bar')
  ).resolves.toBe(false);
  expect(fs.readFile.mock).toHaveBeenCalledTimes(1);
  expect(fs.writeFile.mock).toHaveBeenCalledTimes(1);
  expect(fs.writeFile.mock).toHaveBeenCalledWith(
    './foo',
    expect.any(String),
    'utf8',
    expect.any(Function)
  );
  expect(fs.writeFile.mock.calls[0].args[1]).toMatchInlineSnapshot(`
            "[test.my_entity.some_resource]
            key1 = \\"foo\\"
            key2 = 123
            key3 = \\"bar\\"
            "
      `);

  await expect(
    fileStore.setAsset('test', 'my_entity', 'some_resource', 'key1', 'bar')
  ).resolves.toBe(true);
  expect(fs.writeFile.mock.calls[1].args[1]).toMatchInlineSnapshot(`
            "[test.my_entity.some_resource]
            key1 = \\"bar\\"
            key2 = 123
            "
      `);

  await expect(
    fileStore.setAsset('test', 'my_entity', 'another_resource', 'key1', 'bar')
  ).resolves.toBe(false);
  expect(fs.writeFile.mock.calls[2].args[1]).toMatchInlineSnapshot(`
    "[test.my_entity.some_resource]
    key1 = \\"foo\\"
    key2 = 123

    [test.my_entity.another_resource]
    key1 = \\"bar\\"
    "
  `);

  await expect(
    fileStore.setAsset('test', 'another_entity', 'some_resource', 'key1', 'baz')
  ).resolves.toBe(false);
  expect(fs.writeFile.mock.calls[3].args[1]).toMatchInlineSnapshot(`
        "[test.my_entity.some_resource]
        key1 = \\"foo\\"
        key2 = 123

        [test.another_entity.some_resource]
        key1 = \\"baz\\"
        "
    `);

  expect(fs.readFile.mock).toHaveBeenCalledTimes(4);
  expect(fs.writeFile.mock).toHaveBeenCalledTimes(4);
});

it('delete stored asset from file', async () => {
  const fileStore = new FileAssetStore({ path: './foo' });

  fs.readFile.mock.fake((path, opts, cb) => {
    cb(
      null,
      `
[test.my_entity.some_resource]
key1 = 'foo'
key2 = 123
    `
    );
  });

  await expect(
    fileStore.deleteAsset('test', 'my_entity', 'some_resource', 'key2')
  ).resolves.toBe(true);
  expect(fs.readFile.mock).toHaveBeenCalledTimes(1);
  expect(fs.writeFile.mock).toHaveBeenCalledTimes(1);
  expect(fs.writeFile.mock).toHaveBeenCalledWith(
    './foo',
    expect.any(String),
    'utf8',
    expect.any(Function)
  );
  expect(fs.writeFile.mock.calls[0].args[1]).toMatchInlineSnapshot(`
            "[test.my_entity.some_resource]
            key1 = \\"foo\\"
            "
      `);

  await expect(
    fileStore.deleteAsset('test', 'my_entity', 'some_resource', 'key1')
  ).resolves.toBe(true);
  expect(fs.writeFile.mock.calls[1].args[1]).toMatchInlineSnapshot(`
            "[test.my_entity.some_resource]
            key2 = 123
            "
      `);
  expect(fs.readFile.mock).toHaveBeenCalledTimes(2);
  expect(fs.writeFile.mock).toHaveBeenCalledTimes(2);

  await expect(
    fileStore.deleteAsset('test', 'my_entity', 'some_resource', 'key3')
  ).resolves.toBe(false);
  expect(fs.readFile.mock).toHaveBeenCalledTimes(3);
  expect(fs.writeFile.mock).toHaveBeenCalledTimes(2);

  await expect(
    fileStore.deleteAsset('test', 'my_entity', 'empty_resource', 'key1')
  ).resolves.toBe(false);
  expect(fs.readFile.mock).toHaveBeenCalledTimes(4);
  expect(fs.writeFile.mock).toHaveBeenCalledTimes(2);
});
