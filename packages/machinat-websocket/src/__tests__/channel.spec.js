import { ConnectionChannel, UserChannel, TopicChannel } from '../channel';

test('ConnectionChannel(serverId, connId)', () => {
  const channel = new ConnectionChannel('#server', '#conn');

  expect(channel.platform).toBe('web_socket');
  expect(channel.type).toBe('connection');
  expect(channel.serverId).toBe('#server');
  expect(channel.connectionId).toBe('#conn');
  expect(channel.id).toBe('#conn');
  expect(channel.uid).toMatchInlineSnapshot(`"web_socket.conn.#server.#conn"`);
});

test('TopicChannel(name, id)', () => {
  const channel = new TopicChannel('foo');
  expect(channel.platform).toBe('web_socket');
  expect(channel.type).toBe('topic');
  expect(channel.name).toBe('foo');
  expect(channel.uid).toMatchInlineSnapshot(`"web_socket.topic.foo"`);
});

test('UserChannel(user)', () => {
  const user = { platform: 'foo', name: 'jojo', uid: 'jojo_doe' };
  const channel = new UserChannel(user);

  expect(channel.user).toBe(user);
  expect(channel.platform).toBe('web_socket');
  expect(channel.type).toBe('user');
  expect(channel.userUId).toBe('jojo_doe');
  expect(channel.uid).toMatchInlineSnapshot(`"web_socket.user.jojo_doe"`);
});
