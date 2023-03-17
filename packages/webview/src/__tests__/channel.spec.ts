import {
  WebviewConnection,
  WebviewUserThread,
  WebviewTopicThread,
} from '../thread';

test('WebviewConnection(serverId, connId)', () => {
  const thread = new WebviewConnection('#server', '#conn');

  expect(thread.platform).toBe('webview');
  expect(thread.type).toBe('connection');
  expect(thread.serverId).toBe('#server');
  expect(thread.id).toBe('#conn');

  expect(thread.uid).toMatchInlineSnapshot(`"webview.conn.#server.#conn"`);
  expect(thread.uniqueIdentifier).toMatchInlineSnapshot(`
    Object {
      "id": "#conn",
      "platform": "webview",
      "scopeId": "#server",
    }
  `);

  expect(thread.typeName()).toBe('WebviewConn');
  expect(thread.toJSONValue()).toMatchInlineSnapshot(`
    Object {
      "id": "#conn",
      "server": "#server",
    }
  `);
  expect(WebviewConnection.fromJSONValue(thread.toJSONValue())).toStrictEqual(
    thread
  );
});

test('WebviewTopicThread(name, id)', () => {
  const thread = new WebviewTopicThread('foo');
  expect(thread.platform).toBe('webview');
  expect(thread.type).toBe('topic');
  expect(thread.name).toBe('foo');

  expect(thread.uid).toMatchInlineSnapshot(`"webview.topic.foo"`);
  expect(thread.uniqueIdentifier).toMatchInlineSnapshot(`
    Object {
      "id": "foo",
      "platform": "webview",
      "scopeId": "topic",
    }
  `);

  expect(thread.typeName()).toBe('WebviewTopicCh');
  expect(thread.toJSONValue()).toMatchInlineSnapshot(`
    Object {
      "name": "foo",
    }
  `);
  expect(WebviewTopicThread.fromJSONValue(thread.toJSONValue())).toStrictEqual(
    thread
  );
});

test('WebviewUserThread(user)', () => {
  const thread = new WebviewUserThread('jojo_doe');

  expect(thread.platform).toBe('webview');
  expect(thread.type).toBe('user');
  expect(thread.userUid).toBe('jojo_doe');

  expect(thread.uid).toMatchInlineSnapshot(`"webview.user.jojo_doe"`);
  expect(thread.uniqueIdentifier).toMatchInlineSnapshot(`
    Object {
      "id": "jojo_doe",
      "platform": "webview",
      "scopeId": "user",
    }
  `);

  expect(thread.typeName()).toBe('WebviewUserCh');
  expect(thread.toJSONValue()).toMatchInlineSnapshot(`
    Object {
      "user": "jojo_doe",
    }
  `);
  expect(WebviewUserThread.fromJSONValue(thread.toJSONValue())).toStrictEqual(
    thread
  );
});
