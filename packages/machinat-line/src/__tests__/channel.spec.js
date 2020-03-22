import LineChannel from '../channel';

test('user source', () => {
  const channel = new LineChannel('_LINE_CHANNEL_ID_', {
    type: 'user',
    userId: 'foo',
  });

  expect(channel.platform).toBe('line');
  expect(channel.type).toBe('user');
  expect(channel.subtype).toBe(undefined);

  expect(channel.source).toEqual({ type: 'user', userId: 'foo' });
  expect(channel.sourceId).toBe('foo');

  expect(channel.uid).toMatchInlineSnapshot(
    `"line._LINE_CHANNEL_ID_.user.foo"`
  );
});

test('room source', () => {
  const channel = new LineChannel('_LINE_CHANNEL_ID_', {
    type: 'room',
    roomId: 'foo',
  });

  expect(channel.platform).toBe('line');
  expect(channel.type).toBe('room');
  expect(channel.subtype).toBe(undefined);

  expect(channel.source).toEqual({ type: 'room', roomId: 'foo' });
  expect(channel.sourceId).toBe('foo');

  expect(channel.uid).toMatchInlineSnapshot(
    `"line._LINE_CHANNEL_ID_.room.foo"`
  );
});

test('group source', () => {
  const channel = new LineChannel('_LINE_CHANNEL_ID_', {
    type: 'group',
    groupId: 'foo',
  });

  expect(channel.platform).toBe('line');
  expect(channel.type).toBe('group');
  expect(channel.subtype).toBe(undefined);

  expect(channel.source).toEqual({ type: 'group', groupId: 'foo' });
  expect(channel.sourceId).toBe('foo');

  expect(channel.uid).toMatchInlineSnapshot(
    `"line._LINE_CHANNEL_ID_.group.foo"`
  );
});
