import ChatThread from '../thread';

test('user source', () => {
  const thread = new ChatThread(
    { type: 'user', userId: 'foo' },
    '_TOKEN_',
    false
  );

  expect(thread.platform).toBe('line');
  expect(thread.type).toBe('chat');
  expect(thread.subtype).toBe('user');
  expect(thread.uid).toBe('line:default:user:foo');

  expect(thread.source).toEqual({ type: 'user', userId: 'foo' });
  expect(thread.sourceId).toBe('foo');
});

test('room source', () => {
  const thread = new ChatThread(
    { type: 'room', roomId: 'foo' },
    '_TOKEN_',
    false
  );

  expect(thread.platform).toBe('line');
  expect(thread.type).toBe('chat');
  expect(thread.subtype).toBe('room');
  expect(thread.uid).toBe('line:default:room:foo');

  expect(thread.source).toEqual({ type: 'room', roomId: 'foo' });
  expect(thread.sourceId).toBe('foo');
});

test('group source', () => {
  const thread = new ChatThread(
    { type: 'group', groupId: 'foo' },
    '_TOKEN_',
    false
  );

  expect(thread.platform).toBe('line');
  expect(thread.type).toBe('chat');
  expect(thread.subtype).toBe('group');
  expect(thread.source).toEqual({ type: 'group', groupId: 'foo' });
  expect(thread.sourceId).toBe('foo');
});
