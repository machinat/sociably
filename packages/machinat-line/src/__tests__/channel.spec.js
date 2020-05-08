import LineChannel from '../channel';

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

describe('LineChannel.fromLIFFContext()', () => {
  test('from utou context', () => {
    expect(
      LineChannel.fromLIFFContext('_PROVIDER_ID_', '_BOT_CHANNEL_ID_', {
        type: 'utou',
        utouId: '_UTOU_ID_',
        userId: '_USER_ID_',
        viewType: 'full',
        accessTokenHash: '...',
        availability: '...',
      })
    ).toEqual(
      new LineChannel('_PROVIDER_ID_', '_BOT_CHANNEL_ID_', 'utou', '_UTOU_ID_')
    );
  });

  test('from room source', () => {
    expect(
      LineChannel.fromLIFFContext('_PROVIDER_ID_', '_BOT_CHANNEL_ID_', {
        type: 'room',
        roomId: '_ROOM_ID_',
        userId: '_USER_ID_',
        viewType: 'full',
        accessTokenHash: '...',
        availability: '...',
      })
    ).toEqual(
      new LineChannel('_PROVIDER_ID_', '_BOT_CHANNEL_ID_', 'room', '_ROOM_ID_')
    );
  });

  test('from group source', () => {
    expect(
      LineChannel.fromLIFFContext('_PROVIDER_ID_', '_BOT_CHANNEL_ID_', {
        type: 'group',
        groupId: '_GROUP_ID_',
        userId: '_USER_ID_',
        viewType: 'full',
        accessTokenHash: '...',
        availability: '...',
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

  test('return utob channel if isOnBotChannel set to true', () => {
    expect(
      LineChannel.fromLIFFContext(
        '_PROVIDER_ID_',
        '_BOT_CHANNEL_ID_',
        {
          type: 'utou',
          utouId: '_UTOU_ID_',
          userId: '_USER_ID_',
          viewType: 'full',
          accessTokenHash: '...',
          availability: '...',
        },
        true
      )
    ).toEqual(
      new LineChannel('_PROVIDER_ID_', '_BOT_CHANNEL_ID_', 'utob', '_USER_ID_')
    );
  });

  test('throw if context type is not utou when isOnBotChannel set to true', () => {
    expect(() =>
      LineChannel.fromLIFFContext(
        '_PROVIDER_ID_',
        '_BOT_CHANNEL_ID_',
        {
          type: 'group',
          groupId: '_GROUP_ID_',
          userId: '_USER_ID_',
          viewType: 'full',
          accessTokenHash: '...',
          availability: '...',
        },
        true
      )
    ).toThrowErrorMatchingInlineSnapshot(
      `"cannot create an utob channel from a \\"group\\" context"`
    );
  });
});
