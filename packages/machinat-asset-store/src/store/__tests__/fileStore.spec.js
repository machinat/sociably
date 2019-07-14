import fs from 'fs';
import FileAssetStore from '../fileStore';

jest.mock('fs');

beforeEach(() => {
  fs.mock.reset();
});

it('read toml format from file', async () => {
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
  expect(fs.readFile.mock).toHaveBeenCalledTimes(2);

  await expect(
    fileStore.getAsset('test', 'my_entity', 'another_resource', 'key1')
  ).resolves.toBe('bar');
  expect(fs.readFile.mock).toHaveBeenCalledTimes(3);

  await expect(
    fileStore.getAsset('test', 'another_entity', 'some_resource', 'key1')
  ).resolves.toBe('baz');
  expect(fs.readFile.mock).toHaveBeenCalledTimes(4);

  await expect(
    fileStore.getAsset('test', 'my_entity', 'some_resource', 'key3')
  ).resolves.toBe(undefined);
  expect(fs.readFile.mock).toHaveBeenCalledTimes(5);

  await expect(
    fileStore.getAsset('test', 'my_entity', 'empty_resource', 'key1')
  ).resolves.toBe(undefined);
  expect(fs.readFile.mock).toHaveBeenCalledTimes(6);

  await expect(
    fileStore.getAsset('test', 'entity_not_existed', 'some_resource', 'key1')
  ).resolves.toBe(undefined);
  expect(fs.readFile.mock).toHaveBeenCalledTimes(7);
});

it('write toml format to file', async () => {
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
  expect(fs.readFile.mock).toHaveBeenCalledTimes(2);
  expect(fs.writeFile.mock).toHaveBeenCalledTimes(2);
  expect(fs.writeFile.mock.calls[1].args[1]).toMatchInlineSnapshot(`
            "[test.my_entity.some_resource]
            key1 = \\"bar\\"
            key2 = 123
            "
      `);

  await expect(
    fileStore.setAsset('test', 'my_entity', 'another_resource', 'key1', 'bar')
  ).resolves.toBe(false);
  expect(fs.readFile.mock).toHaveBeenCalledTimes(3);
  expect(fs.writeFile.mock).toHaveBeenCalledTimes(3);
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
  expect(fs.readFile.mock).toHaveBeenCalledTimes(4);
  expect(fs.writeFile.mock).toHaveBeenCalledTimes(4);
  expect(fs.writeFile.mock.calls[3].args[1]).toMatchInlineSnapshot(`
        "[test.my_entity.some_resource]
        key1 = \\"foo\\"
        key2 = 123

        [test.another_entity.some_resource]
        key1 = \\"baz\\"
        "
    `);
});
