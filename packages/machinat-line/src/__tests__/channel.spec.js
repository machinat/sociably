import LineChannel from '../channel';

test('user source', () => {
  const channel = new LineChannel(
    { type: 'user', userId: 'foo' },
    '_LINE_CHANNEL_ID_'
  );

  expect(channel.platform).toBe('line');
  expect(channel.type).toBe('chat');
  expect(channel.subtype).toBe('user');
  expect(channel.uid).toBe('line:_LINE_CHANNEL_ID_:user:foo');

  expect(channel.source).toEqual({ type: 'user', userId: 'foo' });
  expect(channel.sourceId).toBe('foo');
});

test('room source', () => {
  const channel = new LineChannel(
    { type: 'room', roomId: 'foo' },
    '_LINE_CHANNEL_ID_'
  );

  expect(channel.platform).toBe('line');
  expect(channel.type).toBe('chat');
  expect(channel.subtype).toBe('room');
  expect(channel.uid).toBe('line:_LINE_CHANNEL_ID_:room:foo');

  expect(channel.source).toEqual({ type: 'room', roomId: 'foo' });
  expect(channel.sourceId).toBe('foo');
});

test('group source', () => {
  const channel = new LineChannel(
    { type: 'group', groupId: 'foo' },
    '_LINE_CHANNEL_ID_'
  );

  expect(channel.platform).toBe('line');
  expect(channel.type).toBe('chat');
  expect(channel.subtype).toBe('group');
  expect(channel.source).toEqual({ type: 'group', groupId: 'foo' });
  expect(channel.sourceId).toBe('foo');
});

test('with empty line channel id', () => {
  const channel = new LineChannel({ type: 'user', userId: 'foo' });

  expect(channel.uid).toBe('line:*:user:foo');
});
