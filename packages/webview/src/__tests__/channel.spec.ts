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
  expect(channel.uid).toMatchInlineSnapshot(`"wv.conn.#server.#conn"`);

  expect(channel.typeName()).toBe('WvConnection');
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
  expect(channel.uid).toMatchInlineSnapshot(`"wv.topic.foo"`);

  expect(channel.typeName()).toBe('WvTopicCh');
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
  expect(channel.uid).toMatchInlineSnapshot(`"wv.user.jojo_doe"`);

  expect(channel.typeName()).toBe('WvUserCh');
  expect(channel.toJSONValue()).toMatchInlineSnapshot(`
    Object {
      "user": "jojo_doe",
    }
  `);
  expect(WebviewUserChannel.fromJSONValue(channel.toJSONValue())).toStrictEqual(
    channel
  );
});
