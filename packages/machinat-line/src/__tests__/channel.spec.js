import LineChannel from '../channel';

test('user source', () => {
  const channel = new LineChannel(
    { type: 'user', userId: 'foo' },
    '_TOKEN_',
    false
  );

  expect(channel.platform).toBe('line');
  expect(channel.type).toBe('chat');
  expect(channel.subtype).toBe('user');
  expect(channel.uid).toBe('line:default:user:foo');

  expect(channel.source).toEqual({ type: 'user', userId: 'foo' });
  expect(channel.sourceId).toBe('foo');
});

test('room source', () => {
  const channel = new LineChannel(
    { type: 'room', roomId: 'foo' },
    '_TOKEN_',
    false
  );

  expect(channel.platform).toBe('line');
  expect(channel.type).toBe('chat');
  expect(channel.subtype).toBe('room');
  expect(channel.uid).toBe('line:default:room:foo');

  expect(channel.source).toEqual({ type: 'room', roomId: 'foo' });
  expect(channel.sourceId).toBe('foo');
});

test('group source', () => {
  const channel = new LineChannel(
    { type: 'group', groupId: 'foo' },
    '_TOKEN_',
    false
  );

  expect(channel.platform).toBe('line');
  expect(channel.type).toBe('chat');
  expect(channel.subtype).toBe('group');
  expect(channel.source).toEqual({ type: 'group', groupId: 'foo' });
  expect(channel.sourceId).toBe('foo');
});
