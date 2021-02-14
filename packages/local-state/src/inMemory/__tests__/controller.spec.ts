import { InMemoryStateController } from '../controller';

test('channel state', async () => {
  const controller = new InMemoryStateController();

  const fooChannel = { platform: 'test', uid: 'foo' };
  const fooState = controller.channelState(fooChannel);
  const barState = controller.channelState('bar');

  await expect(fooState.get('key1')).resolves.toBe(undefined);

  await expect(fooState.set('key1', 'foo')).resolves.toBe(false);
  await expect(fooState.get('key1')).resolves.toBe('foo');

  await expect(fooState.set('key1', 'bar')).resolves.toBe(true);
  await expect(fooState.get('key1')).resolves.toBe('bar');

  await expect(fooState.set('key2', 'baz')).resolves.toBe(false);
  await expect(fooState.get('key2')).resolves.toBe('baz');
  await expect(fooState.getAll()).resolves.toMatchInlineSnapshot(`
          Map {
            "key1" => "bar",
            "key2" => "baz",
          }
        `);

  await expect(
    barState.set('key1', { foo: { bar: { baz: 'bae' } } })
  ).resolves.toBe(false);
  await expect(barState.get('key1')).resolves.toEqual({
    foo: { bar: { baz: 'bae' } },
  });
  await expect(barState.getAll()).resolves.toMatchInlineSnapshot(`
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

  await expect(fooState.delete('key2')).resolves.toBe(true);
  await expect(fooState.get('key2')).resolves.toBe(undefined);

  await expect(fooState.delete('key2')).resolves.toBe(false);
  await expect(fooState.getAll()).resolves.toMatchInlineSnapshot(`
          Map {
            "key1" => "bar",
          }
        `);

  await expect(fooState.delete('key1')).resolves.toBe(true);
  await expect(fooState.getAll()).resolves.toEqual(new Map());

  await expect(barState.clear()).resolves.toBe(1);
  await expect(barState.get('key1')).resolves.toBe(undefined);
  await expect(barState.getAll()).resolves.toEqual(new Map());
});

test('user state', async () => {
  const controller = new InMemoryStateController();

  const fooUser = { platform: 'test', uid: 'foo' };
  const fooState = controller.userState(fooUser);
  const barState = controller.userState('bar');

  await expect(fooState.get('key1')).resolves.toBe(undefined);

  await expect(fooState.set('key1', 'foo')).resolves.toBe(false);
  await expect(fooState.get('key1')).resolves.toBe('foo');

  await expect(fooState.set('key1', 'bar')).resolves.toBe(true);
  await expect(fooState.get('key1')).resolves.toBe('bar');

  await expect(fooState.set('key2', 'baz')).resolves.toBe(false);
  await expect(fooState.get('key2')).resolves.toBe('baz');
  await expect(fooState.getAll()).resolves.toMatchInlineSnapshot(`
          Map {
            "key1" => "bar",
            "key2" => "baz",
          }
        `);

  await expect(
    barState.set('key1', { foo: { bar: { baz: 'bae' } } })
  ).resolves.toBe(false);
  await expect(barState.get('key1')).resolves.toEqual({
    foo: { bar: { baz: 'bae' } },
  });
  await expect(barState.getAll()).resolves.toMatchInlineSnapshot(`
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

  await expect(fooState.delete('key2')).resolves.toBe(true);
  await expect(fooState.get('key2')).resolves.toBe(undefined);

  await expect(fooState.delete('key2')).resolves.toBe(false);
  await expect(fooState.getAll()).resolves.toMatchInlineSnapshot(`
          Map {
            "key1" => "bar",
          }
        `);

  await expect(fooState.delete('key1')).resolves.toBe(true);
  await expect(fooState.getAll()).resolves.toEqual(new Map());

  await expect(barState.clear()).resolves.toBe(1);
  await expect(barState.get('key1')).resolves.toBe(undefined);
  await expect(barState.getAll()).resolves.toEqual(new Map());
});

test('global state', async () => {
  const controller = new InMemoryStateController();

  const fooState = controller.globalState('foo');
  const barState = controller.globalState('bar');

  await expect(fooState.get('key1')).resolves.toBe(undefined);

  await expect(fooState.set('key1', 'foo')).resolves.toBe(false);
  await expect(fooState.get('key1')).resolves.toBe('foo');

  await expect(fooState.set('key1', 'bar')).resolves.toBe(true);
  await expect(fooState.get('key1')).resolves.toBe('bar');

  await expect(fooState.set('key2', 'baz')).resolves.toBe(false);
  await expect(fooState.get('key2')).resolves.toBe('baz');
  await expect(fooState.getAll()).resolves.toMatchInlineSnapshot(`
          Map {
            "key1" => "bar",
            "key2" => "baz",
          }
        `);

  await expect(
    barState.set('key1', { foo: { bar: { baz: 'bae' } } })
  ).resolves.toBe(false);
  await expect(barState.get('key1')).resolves.toEqual({
    foo: { bar: { baz: 'bae' } },
  });
  await expect(barState.getAll()).resolves.toMatchInlineSnapshot(`
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

  await expect(fooState.delete('key2')).resolves.toBe(true);
  await expect(fooState.get('key2')).resolves.toBe(undefined);

  await expect(fooState.delete('key2')).resolves.toBe(false);
  await expect(fooState.getAll()).resolves.toMatchInlineSnapshot(`
          Map {
            "key1" => "bar",
          }
        `);

  await expect(fooState.delete('key1')).resolves.toBe(true);
  await expect(fooState.getAll()).resolves.toEqual(new Map());

  await expect(barState.clear()).resolves.toBe(1);
  await expect(barState.get('key1')).resolves.toBe(undefined);
  await expect(barState.getAll()).resolves.toEqual(new Map());
});
