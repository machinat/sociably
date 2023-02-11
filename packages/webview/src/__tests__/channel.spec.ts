import {
  WebviewConnection,
  WebviewUserChannel,
  WebviewTopicChannel,
} from '../channel';

test('WebviewConnection(serverId, connId)', () => {
  const channel = new WebviewConnection('#server', '#conn');

  expect(channel.platform).toBe('webview');
  expect(channel.type).toBe('connection');
  expect(channel.serverId).toBe('#server');
  expect(channel.id).toBe('#conn');

  expect(channel.uid).toMatchInlineSnapshot(`"webview.conn.#server.#conn"`);
  expect(channel.uniqueIdentifier).toMatchInlineSnapshot(`
    Object {
      "id": "#conn",
      "platform": "webview",
      "scopeId": "#server",
    }
  `);

  expect(channel.typeName()).toBe('WebviewConn');
  expect(channel.toJSONValue()).toMatchInlineSnapshot(`
    Object {
      "id": "#conn",
      "server": "#server",
    }
  `);
  expect(WebviewConnection.fromJSONValue(channel.toJSONValue())).toStrictEqual(
    channel
  );
});

test('WebviewTopicChannel(name, id)', () => {
  const channel = new WebviewTopicChannel('foo');
  expect(channel.platform).toBe('webview');
  expect(channel.type).toBe('topic');
  expect(channel.name).toBe('foo');

  expect(channel.uid).toMatchInlineSnapshot(`"webview.topic.foo"`);
  expect(channel.uniqueIdentifier).toMatchInlineSnapshot(`
    Object {
      "id": "foo",
      "platform": "webview",
      "scopeId": "topic",
    }
  `);

  expect(channel.typeName()).toBe('WebviewTopicCh');
  expect(channel.toJSONValue()).toMatchInlineSnapshot(`
    Object {
      "name": "foo",
    }
  `);
  expect(
    WebviewTopicChannel.fromJSONValue(channel.toJSONValue())
  ).toStrictEqual(channel);
});

test('WebviewUserChannel(user)', () => {
  const channel = new WebviewUserChannel('jojo_doe');

  expect(channel.platform).toBe('webview');
  expect(channel.type).toBe('user');
  expect(channel.userUid).toBe('jojo_doe');

  expect(channel.uid).toMatchInlineSnapshot(`"webview.user.jojo_doe"`);
  expect(channel.uniqueIdentifier).toMatchInlineSnapshot(`
    Object {
      "id": "jojo_doe",
      "platform": "webview",
      "scopeId": "user",
    }
  `);

  expect(channel.typeName()).toBe('WebviewUserCh');
  expect(channel.toJSONValue()).toMatchInlineSnapshot(`
    Object {
      "user": "jojo_doe",
    }
  `);
  expect(WebviewUserChannel.fromJSONValue(channel.toJSONValue())).toStrictEqual(
    channel
  );
});
