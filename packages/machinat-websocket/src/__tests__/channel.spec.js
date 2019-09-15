import { connectionScope, userScope, topicScope } from '../channel';

describe('connectionScope(connection)', () => {
  it('ok', () => {
    const connection = {
      id: '#conn',
      serverId: '#server',
      socketId: '#socket',
      user: { jane: 'doe' },
      flags: null,
    };
    const scope = connectionScope(connection);

    expect(scope.connection).toBe(connection);
    expect(scope.platform).toBe('websocket');
    expect(scope.type).toBe('connection');
    expect(scope.subtype).toBe('#server');
    expect(scope.id).toBe('#conn');
  });
});

describe('topicScope(name, id)', () => {
  it('ok', () => {
    let scope = topicScope();
    expect(scope).toEqual({ name: 'default' });
    expect(scope.platform).toBe('websocket');
    expect(scope.type).toBe('topic');
    expect(scope.subtype).toBe('default');
    expect(scope.id).toBe(undefined);

    scope = topicScope('foo');
    expect(scope).toEqual({ name: 'foo' });
    expect(scope.platform).toBe('websocket');
    expect(scope.type).toBe('topic');
    expect(scope.subtype).toBe('foo');
    expect(scope.id).toBe(undefined);

    scope = topicScope('foo', 'bar');
    expect(scope).toEqual({ name: 'foo', id: 'bar' });
    expect(scope.platform).toBe('websocket');
    expect(scope.type).toBe('topic');
    expect(scope.subtype).toBe('foo');
    expect(scope.id).toBe('bar');
  });
});

describe('userScope(user)', () => {
  it('ok', () => {
    const user = { platform: 'foo', id: 'bar' };
    const scope = userScope(user);

    expect(scope.user).toBe(user);
    expect(scope.platform).toBe('websocket');
    expect(scope.type).toBe('user');
    expect(scope.subtype).toBe('foo');
    expect(scope.id).toBe('bar');
  });
});
