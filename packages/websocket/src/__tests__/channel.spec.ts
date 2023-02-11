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
  expect(channel.uniqueIdentifier).toMatchInlineSnapshot(`
    Object {
      "id": "#conn",
      "platform": "websocket",
      "scopeId": "#server",
    }
  `);

  expect(channel.typeName()).toBe('WebSocketConn');
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
  expect(channel.uniqueIdentifier).toMatchInlineSnapshot(`
    Object {
      "id": "foo",
      "platform": "websocket",
      "scopeId": "topic",
    }
  `);

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
  expect(channel.uniqueIdentifier).toMatchInlineSnapshot(`
    Object {
      "id": "jojo_doe",
      "platform": "websocket",
      "scopeId": "user",
    }
  `);

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
