import LineChannel from '../channel';

test('utob channel', () => {
  const channel = new LineChannel(
    '_PROVIDER_ID_',
    '_BOT_CHANNEL_ID_',
    'utob',
    '_USER_ID_'
  );

  expect(channel.providerId).toBe('_PROVIDER_ID_');
  expect(channel.botChannelId).toBe('_BOT_CHANNEL_ID_');
  expect(channel.type).toBe('utob');
  expect(channel.id).toBe('_USER_ID_');

  expect(channel.uid).toMatchInlineSnapshot(
    `"line._PROVIDER_ID_._BOT_CHANNEL_ID_._USER_ID_"`
  );
});

test('utou channel', () => {
  const channel = new LineChannel(
    '_PROVIDER_ID_',
    '_BOT_CHANNEL_ID_',
    'utou',
    '_UTOU_ID_'
  );

  expect(channel.providerId).toBe('_PROVIDER_ID_');
  expect(channel.botChannelId).toBe('_BOT_CHANNEL_ID_');
  expect(channel.type).toBe('utou');
  expect(channel.id).toBe('_UTOU_ID_');

  expect(channel.uid).toMatchInlineSnapshot(`"line._PROVIDER_ID_._UTOU_ID_"`);
});

test('room channel', () => {
  const channel = new LineChannel(
    '_PROVIDER_ID_',
    '_BOT_CHANNEL_ID_',
    'room',
    '_ROOM_ID_'
  );

  expect(channel.providerId).toBe('_PROVIDER_ID_');
  expect(channel.botChannelId).toBe('_BOT_CHANNEL_ID_');
  expect(channel.type).toBe('room');
  expect(channel.id).toBe('_ROOM_ID_');

  expect(channel.uid).toMatchInlineSnapshot(`"line._PROVIDER_ID_._ROOM_ID_"`);
});

test('group channel', () => {
  const channel = new LineChannel(
    '_PROVIDER_ID_',
    '_BOT_CHANNEL_ID_',
    'group',
    '_GROUP_ID_'
  );

  expect(channel.providerId).toBe('_PROVIDER_ID_');
  expect(channel.botChannelId).toBe('_BOT_CHANNEL_ID_');
  expect(channel.type).toBe('group');
  expect(channel.id).toBe('_GROUP_ID_');

  expect(channel.uid).toMatchInlineSnapshot(`"line._PROVIDER_ID_._GROUP_ID_"`);
});

describe('LineChannel.fromMessagingSource()', () => {
  test('user source', () => {
    expect(
      LineChannel.fromMessagingSource('_PROVIDER_ID_', '_BOT_CHANNEL_ID_', {
        type: 'user',
        userId: 'john_doe',
      })
    ).toEqual(
      new LineChannel('_PROVIDER_ID_', '_BOT_CHANNEL_ID_', 'utob', 'john_doe')
    );
  });

  test('room source', () => {
    expect(
      LineChannel.fromMessagingSource('_PROVIDER_ID_', '_BOT_CHANNEL_ID_', {
        type: 'room',
        roomId: '_ROOM_ID_',
        userId: 'john_doe',
      })
    ).toEqual(
      new LineChannel('_PROVIDER_ID_', '_BOT_CHANNEL_ID_', 'room', '_ROOM_ID_')
    );
  });

  test('group source', () => {
    expect(
      LineChannel.fromMessagingSource('_PROVIDER_ID_', '_BOT_CHANNEL_ID_', {
        type: 'group',
        groupId: '_GROUP_ID_',
        userId: 'john_doe',
      })
    ).toEqual(
      new LineChannel(
        '_PROVIDER_ID_',
        '_BOT_CHANNEL_ID_',
        'group',
        '_GROUP_ID_'
      )
    );
  });
});
