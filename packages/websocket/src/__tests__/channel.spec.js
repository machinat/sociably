import {
  WebSocketConnection,
  WebSocketUserChannel,
  WebSocketTopicChannel,
} from '../channel';

test('WebSocketConnection(serverId, connId)', () => {
  const channel = new WebSocketConnection('#server', '#conn');

  expect(channel.platform).toBe('web_socket');
  expect(channel.type).toBe('connection');
  expect(channel.serverId).toBe('#server');
  expect(channel.connectionId).toBe('#conn');
  expect(channel.id).toBe('#conn');
  expect(channel.uid).toMatchInlineSnapshot(`"web_socket.conn.#server.#conn"`);

  expect(channel.typeName()).toBe('WebSocketConnection');
  expect(channel.toJSONValue()).toMatchInlineSnapshot(`
    Object {
      "connectionId": "#conn",
      "serverId": "#server",
    }
  `);
  expect(
    WebSocketConnection.fromJSONValue(channel.toJSONValue())
  ).toStrictEqual(channel);
});

test('WebSocketTopicChannel(name, id)', () => {
  const channel = new WebSocketTopicChannel('foo');
  expect(channel.platform).toBe('web_socket');
  expect(channel.type).toBe('topic');
  expect(channel.name).toBe('foo');
  expect(channel.uid).toMatchInlineSnapshot(`"web_socket.topic.foo"`);

  expect(channel.typeName()).toBe('WebSocketTopicChannel');
  expect(channel.toJSONValue()).toMatchInlineSnapshot(`
    Object {
      "name": "foo",
    }
  `);
  expect(
    WebSocketTopicChannel.fromJSONValue(channel.toJSONValue())
  ).toStrictEqual(channel);
});

test('WebSocketUserChannel(user)', () => {
  const channel = new WebSocketUserChannel('jojo_doe');

  expect(channel.platform).toBe('web_socket');
  expect(channel.type).toBe('user');
  expect(channel.userUId).toBe('jojo_doe');
  expect(channel.uid).toMatchInlineSnapshot(`"web_socket.user.jojo_doe"`);

  expect(channel.typeName()).toBe('WebSocketUserChannel');
  expect(channel.toJSONValue()).toMatchInlineSnapshot(`
    Object {
      "userUId": "jojo_doe",
    }
  `);
  expect(
    WebSocketUserChannel.fromJSONValue(channel.toJSONValue())
  ).toStrictEqual(channel);
});
