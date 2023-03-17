import {
  WebSocketConnection,
  WebSocketUserThread,
  WebSocketTopicThread,
} from '../thread';

test('WebSocketConnection(serverId, connId)', () => {
  const thread = new WebSocketConnection('#server', '#conn');

  expect(thread.platform).toBe('websocket');
  expect(thread.type).toBe('connection');
  expect(thread.serverId).toBe('#server');
  expect(thread.id).toBe('#conn');

  expect(thread.uid).toMatchInlineSnapshot(`"websocket.conn.#server.#conn"`);
  expect(thread.uniqueIdentifier).toMatchInlineSnapshot(`
    Object {
      "id": "#conn",
      "platform": "websocket",
      "scopeId": "#server",
    }
  `);

  expect(thread.typeName()).toBe('WebSocketConn');
  expect(thread.toJSONValue()).toMatchInlineSnapshot(`
    Object {
      "id": "#conn",
      "server": "#server",
    }
  `);
  expect(WebSocketConnection.fromJSONValue(thread.toJSONValue())).toStrictEqual(
    thread
  );
});

test('WebSocketTopicThread(name, id)', () => {
  const thread = new WebSocketTopicThread('foo');
  expect(thread.platform).toBe('websocket');
  expect(thread.type).toBe('topic');
  expect(thread.name).toBe('foo');

  expect(thread.uid).toMatchInlineSnapshot(`"websocket.topic.foo"`);
  expect(thread.uniqueIdentifier).toMatchInlineSnapshot(`
    Object {
      "id": "foo",
      "platform": "websocket",
      "scopeId": "topic",
    }
  `);

  expect(thread.typeName()).toBe('WebSocketTopicCh');
  expect(thread.toJSONValue()).toMatchInlineSnapshot(`
    Object {
      "name": "foo",
    }
  `);
  expect(
    WebSocketTopicThread.fromJSONValue(thread.toJSONValue())
  ).toStrictEqual(thread);
});

test('WebSocketUserThread(user)', () => {
  const thread = new WebSocketUserThread('jojo_doe');

  expect(thread.platform).toBe('websocket');
  expect(thread.type).toBe('user');
  expect(thread.userUid).toBe('jojo_doe');

  expect(thread.uid).toMatchInlineSnapshot(`"websocket.user.jojo_doe"`);
  expect(thread.uniqueIdentifier).toMatchInlineSnapshot(`
    Object {
      "id": "jojo_doe",
      "platform": "websocket",
      "scopeId": "user",
    }
  `);

  expect(thread.typeName()).toBe('WebSocketUserCh');
  expect(thread.toJSONValue()).toMatchInlineSnapshot(`
    Object {
      "user": "jojo_doe",
    }
  `);
  expect(WebSocketUserThread.fromJSONValue(thread.toJSONValue())).toStrictEqual(
    thread
  );
});
