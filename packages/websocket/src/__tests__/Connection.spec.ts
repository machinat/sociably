import WebSocketConnection from '../Connection.js';

test('WebSocketConnection(serverId, connId)', () => {
  const thread = new WebSocketConnection('#server', '#conn');

  expect(thread.platform).toBe('websocket');
  expect(thread.type).toBe('connection');
  expect(thread.serverId).toBe('#server');
  expect(thread.id).toBe('#conn');

  expect(thread.uid).toMatchInlineSnapshot(`"websocket.#server.#conn"`);
  expect(thread.uniqueIdentifier).toMatchInlineSnapshot(`
    {
      "$$typeof": [
        "thread",
      ],
      "id": "#conn",
      "platform": "websocket",
      "scopeId": "#server",
    }
  `);

  expect(thread.typeName()).toBe('WebSocketConnection');
  expect(thread.toJSONValue()).toMatchInlineSnapshot(`
    {
      "id": "#conn",
      "server": "#server",
    }
  `);
  expect(WebSocketConnection.fromJSONValue(thread.toJSONValue())).toStrictEqual(
    thread
  );
});
