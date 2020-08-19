import { InMemoryRepository } from '../repository';

test('ok', async () => {
  const repo = new InMemoryRepository();

  await expect(repo.get('my_resource', 'key1')).resolves.toBe(undefined);

  await expect(repo.set('my_resource', 'key1', 'foo')).resolves.toBe(false);
  await expect(repo.get('my_resource', 'key1')).resolves.toBe('foo');

  await expect(repo.set('my_resource', 'key1', 'bar')).resolves.toBe(true);
  await expect(repo.get('my_resource', 'key1')).resolves.toBe('bar');

  await expect(repo.set('my_resource', 'key2', 'baz')).resolves.toBe(false);
  await expect(repo.get('my_resource', 'key2')).resolves.toBe('baz');
  await expect(repo.getAll('my_resource')).resolves.toMatchInlineSnapshot(`
          Map {
            "key1" => "bar",
            "key2" => "baz",
          }
        `);

  await expect(
    repo.set('some_resource', 'key1', { foo: { bar: { baz: 'bae' } } })
  ).resolves.toBe(false);
  await expect(repo.get('some_resource', 'key1')).resolves.toEqual({
    foo: { bar: { baz: 'bae' } },
  });
  await expect(repo.getAll('some_resource')).resolves.toMatchInlineSnapshot(`
          Map {
            "key1" => Object {
              "foo": Object {
                "bar": Object {
                  "baz": "bae",
                },
              },
            },
          }
        `);

  await expect(repo.delete('my_resource', 'key2')).resolves.toBe(true);
  await expect(repo.get('my_resource', 'key2')).resolves.toBe(undefined);

  await expect(repo.delete('my_resource', 'key2')).resolves.toBe(false);
  await expect(repo.getAll('my_resource')).resolves.toMatchInlineSnapshot(`
          Map {
            "key1" => "bar",
          }
        `);

  await expect(repo.delete('my_resource', 'key1')).resolves.toBe(true);
  await expect(repo.getAll('my_resource')).resolves.toBe(null);

  await expect(repo.clear('some_resource')).resolves.toBe(undefined);
  await expect(repo.get('some_resource', 'key1')).resolves.toBe(undefined);
  await expect(repo.getAll('some_resource')).resolves.toBe(null);
});
