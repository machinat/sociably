import WebSocketChannel from '../channel';

it('ok', () => {
  expect(new WebSocketChannel()).toEqual({
    platform: 'websocket',
    type: 'default',
    uid: 'websocket:default:*:*',
  });

  expect(new WebSocketChannel('foo')).toEqual({
    platform: 'websocket',
    type: 'foo',
    uid: 'websocket:foo:*:*',
  });

  expect(new WebSocketChannel('foo', 'bar')).toEqual({
    platform: 'websocket',
    type: 'foo',
    subtype: 'bar',
    uid: 'websocket:foo:bar:*',
  });

  expect(new WebSocketChannel('foo', 'bar', 'baz')).toEqual({
    platform: 'websocket',
    type: 'foo',
    subtype: 'bar',
    id: 'baz',
    uid: 'websocket:foo:bar:baz',
  });
});
