import { ConnectionChannel, UserChannel, TopicChannel } from '../channel';

test('ConnectionChannel(serverId, connId)', () => {
  const scope = new ConnectionChannel('#server', '#conn');

  expect(scope.platform).toBe('websocket');
  expect(scope.type).toBe('connection');
  expect(scope.serverId).toBe('#server');
  expect(scope.connectionId).toBe('#conn');
  expect(scope.id).toBe('#conn');
  expect(scope.uid).toMatchInlineSnapshot(`"websocket.conn.#server.#conn"`);
});

test('TopicChannel(name, id)', () => {
  const scope = new TopicChannel('foo');
  expect(scope.platform).toBe('websocket');
  expect(scope.type).toBe('topic');
  expect(scope.name).toBe('foo');
  expect(scope.uid).toMatchInlineSnapshot(`"websocket.topic.foo"`);
});

test('UserChannel(user)', () => {
  const user = { platform: 'foo', name: 'jojo', uid: 'jojo_doe' };
  const scope = new UserChannel(user);

  expect(scope.user).toBe(user);
  expect(scope.platform).toBe('websocket');
  expect(scope.type).toBe('user');
  expect(scope.userUId).toBe('jojo_doe');
  expect(scope.uid).toMatchInlineSnapshot(`"websocket.user.jojo_doe"`);
});
