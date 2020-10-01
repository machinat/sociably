import LineChat from '../channel';

test('utob channel', () => {
  const channel = new LineChat('_CHANNEL_ID_', 'utob', '_USER_ID_');

  expect(channel.channelId).toBe('_CHANNEL_ID_');
  expect(channel.type).toBe('utob');
  expect(channel.id).toBe('_USER_ID_');

  expect(channel.uid).toMatchInlineSnapshot(`"line._CHANNEL_ID_._USER_ID_"`);
});

test('utou channel', () => {
  const channel = new LineChat('_CHANNEL_ID_', 'utou', '_UTOU_ID_');

  expect(channel.channelId).toBe('_CHANNEL_ID_');
  expect(channel.type).toBe('utou');
  expect(channel.id).toBe('_UTOU_ID_');

  expect(channel.uid).toMatchInlineSnapshot(`"line._CHANNEL_ID_._UTOU_ID_"`);
});

test('room channel', () => {
  const channel = new LineChat('_CHANNEL_ID_', 'room', '_ROOM_ID_');

  expect(channel.channelId).toBe('_CHANNEL_ID_');
  expect(channel.type).toBe('room');
  expect(channel.id).toBe('_ROOM_ID_');

  expect(channel.uid).toMatchInlineSnapshot(`"line._CHANNEL_ID_._ROOM_ID_"`);
});

test('group channel', () => {
  const channel = new LineChat('_CHANNEL_ID_', 'group', '_GROUP_ID_');

  expect(channel.channelId).toBe('_CHANNEL_ID_');
  expect(channel.type).toBe('group');
  expect(channel.id).toBe('_GROUP_ID_');

  expect(channel.uid).toMatchInlineSnapshot(`"line._CHANNEL_ID_._GROUP_ID_"`);
});

describe('LineChat.fromMessagingSource()', () => {
  test('user source', () => {
    expect(
      LineChat.fromMessagingSource('_CHANNEL_ID_', {
        type: 'user',
        userId: 'john_doe',
      })
    ).toEqual(new LineChat('_CHANNEL_ID_', 'utob', 'john_doe'));
  });

  test('room source', () => {
    expect(
      LineChat.fromMessagingSource('_CHANNEL_ID_', {
        type: 'room',
        roomId: '_ROOM_ID_',
        userId: 'john_doe',
      })
    ).toEqual(new LineChat('_CHANNEL_ID_', 'room', '_ROOM_ID_'));
  });

  test('group source', () => {
    expect(
      LineChat.fromMessagingSource('_CHANNEL_ID_', {
        type: 'group',
        groupId: '_GROUP_ID_',
        userId: 'john_doe',
      })
    ).toEqual(new LineChat('_CHANNEL_ID_', 'group', '_GROUP_ID_'));
  });
});
