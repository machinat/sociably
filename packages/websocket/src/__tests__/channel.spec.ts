import {
  WebSocketConnection,
  WebSocketUserChannel,
  WebSocketTopicChannel,
} from '../channel';

test('WebSocketConnection(serverId, connId)', () => {
  const channel = new WebSocketConnection('#server', '#conn');

  expect(channel.platform).toBe('websocket');
  expect(channel.type).toBe('connection');
  expect(channel.serverId).toBe('#server');
  expect(channel.id).toBe('#conn');
  expect(channel.uid).toMatchInlineSnapshot(`"websocket.conn.#server.#conn"`);

  expect(channel.typeName()).toBe('WebSocketConnection');
  expect(channel.toJSONValue()).toMatchInlineSnapshot(`
    Object {
      "id": "#conn",
      "server": "#server",
    }
  `);
  expect(
    WebSocketConnection.fromJSONValue(channel.toJSONValue())
  ).toStrictEqual(channel);
});

test('WebSocketTopicChannel(name, id)', () => {
  const channel = new WebSocketTopicChannel('foo');
  expect(channel.platform).toBe('websocket');
  expect(channel.type).toBe('topic');
  expect(channel.name).toBe('foo');
  expect(channel.uid).toMatchInlineSnapshot(`"websocket.topic.foo"`);

  expect(channel.typeName()).toBe('WebSocketTopicCh');
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

  expect(channel.platform).toBe('websocket');
  expect(channel.type).toBe('user');
  expect(channel.userUid).toBe('jojo_doe');
  expect(channel.uid).toMatchInlineSnapshot(`"websocket.user.jojo_doe"`);

  expect(channel.typeName()).toBe('WebSocketUserCh');
  expect(channel.toJSONValue()).toMatchInlineSnapshot(`
    Object {
      "user": "jojo_doe",
    }
  `);
  expect(
    WebSocketUserChannel.fromJSONValue(channel.toJSONValue())
  ).toStrictEqual(channel);
});
