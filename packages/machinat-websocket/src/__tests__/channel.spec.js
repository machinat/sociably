import {
  ConnectionChannel,
  UserScopeChannel,
  TopicScopeChannel,
} from '../channel';

describe('ConnectionChannel(connection)', () => {
  it('ok', () => {
    const connection = {
      id: '#conn',
      serverId: '#server',
      socketId: '#socket',
      user: { jane: 'doe' },
      flags: null,
    };
    const scope = new ConnectionChannel(connection);

    expect(scope.connection).toBe(connection);
    expect(scope.platform).toBe('websocket');
    expect(scope.type).toBe('connection');
    expect(scope.subtype).toBe(undefined);
    expect(scope.id).toBe('#conn');
  });
});

describe('TopicScopeChannel(name, id)', () => {
  it('ok', () => {
    let scope = new TopicScopeChannel();
    expect(scope.name).toBe('default');
    expect(scope.id).toBe(undefined);
    expect(scope.platform).toBe('websocket');
    expect(scope.type).toBe('topic');
    expect(scope.subtype).toBe('default');

    scope = new TopicScopeChannel('foo');
    expect(scope.name).toBe('foo');
    expect(scope.id).toBe(undefined);
    expect(scope.platform).toBe('websocket');
    expect(scope.type).toBe('topic');
    expect(scope.subtype).toBe('foo');

    scope = new TopicScopeChannel('foo', 'bar');
    expect(scope.name).toEqual('foo');
    expect(scope.id).toEqual('bar');
    expect(scope.platform).toBe('websocket');
    expect(scope.type).toBe('topic');
    expect(scope.subtype).toBe('foo');
  });
});

describe('UserScopeChannel(user)', () => {
  it('ok', () => {
    const user = { platform: 'foo', id: 'bar' };
    const scope = new UserScopeChannel(user);

    expect(scope.user).toBe(user);
    expect(scope.platform).toBe('websocket');
    expect(scope.type).toBe('user');
    expect(scope.subtype).toBe('foo');
    expect(scope.id).toBe('bar');
  });
});
