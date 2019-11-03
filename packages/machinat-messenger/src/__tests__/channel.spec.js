import MessengerChannel from '../channel';

test('from id', () => {
  const channel = new MessengerChannel('_PAGE_ID_', { id: '_PSID_' });

  expect(channel.platform).toBe('messenger');
  expect(channel.type).toBe('USER_TO_PAGE');
  expect(channel.subtype).toBe('psid');
  expect(channel.uid).toBe('messenger:_PAGE_ID_:psid:_PSID_');

  expect(channel.identifier).toBe('_PSID_');
  expect(channel.threadType).toBe('USER_TO_PAGE');
  expect(channel.targetType).toBe('psid');
  expect(channel.target).toEqual({ id: '_PSID_' });
  expect(channel.sendable).toBe(true);
});

test('from user_ref', () => {
  const channel = new MessengerChannel('_PAGE_ID_', { user_ref: '_USER_REF_' });

  expect(channel.platform).toBe('messenger');
  expect(channel.type).toBe('USER_TO_PAGE');
  expect(channel.subtype).toBe('user_ref');
  expect(channel.uid).toBe('messenger:_PAGE_ID_:user_ref:_USER_REF_');

  expect(channel.identifier).toBe('_USER_REF_');
  expect(channel.threadType).toBe('USER_TO_PAGE');
  expect(channel.targetType).toBe('user_ref');
  expect(channel.target).toEqual({ user_ref: '_USER_REF_' });
  expect(channel.sendable).toBe(true);
});

test('from phone_number', () => {
  const channel = new MessengerChannel('_PAGE_ID_', {
    phone_number: '+88888888888',
    name: { first_name: 'jojo', last_name: 'doe' },
  });

  expect(channel.platform).toBe('messenger');
  expect(channel.type).toBe('USER_TO_PAGE');
  expect(channel.subtype).toBe('phone_number');
  expect(channel.uid).toMatchInlineSnapshot(
    `"messenger:_PAGE_ID_:phone_number:nRn5C+EX4/vdk02aEWYs2zV5sHM="`
  );

  expect(channel.identifier).toBe('nRn5C+EX4/vdk02aEWYs2zV5sHM=');
  expect(channel.threadType).toBe('USER_TO_PAGE');
  expect(channel.targetType).toBe('phone_number');
  expect(channel.target).toEqual({
    phone_number: '+88888888888',
    name: { first_name: 'jojo', last_name: 'doe' },
  });
  expect(channel.sendable).toBe(true);
});

test('from post_id', () => {
  const channel = new MessengerChannel('_PAGE_ID_', { post_id: '_POST_ID_' });

  expect(channel.platform).toBe('messenger');
  expect(channel.type).toBe('USER_TO_PAGE');
  expect(channel.subtype).toBe('post_id');
  expect(channel.uid).toBe('messenger:_PAGE_ID_:post_id:_POST_ID_');

  expect(channel.identifier).toBe('_POST_ID_');
  expect(channel.threadType).toBe('USER_TO_PAGE');
  expect(channel.targetType).toBe('post_id');
  expect(channel.target).toEqual({ post_id: '_POST_ID_' });
  expect(channel.sendable).toBe(true);
});

test('from comment_id', () => {
  const channel = new MessengerChannel('_PAGE_ID_', {
    comment_id: '_COMMENT_ID_',
  });

  expect(channel.platform).toBe('messenger');
  expect(channel.type).toBe('USER_TO_PAGE');
  expect(channel.subtype).toBe('comment_id');
  expect(channel.uid).toBe('messenger:_PAGE_ID_:comment_id:_COMMENT_ID_');

  expect(channel.identifier).toBe('_COMMENT_ID_');
  expect(channel.threadType).toBe('USER_TO_PAGE');
  expect(channel.targetType).toBe('comment_id');
  expect(channel.target).toEqual({ comment_id: '_COMMENT_ID_' });
  expect(channel.sendable).toBe(true);
});

describe('.fromExtensionContext(pageId, ctx)', () => {
  test('within user to page thread', () => {
    const channel = MessengerChannel.fromExtensionContext({
      psid: '_USER_PSID_',
      algorithm: 'sha256',
      thread_type: 'USER_TO_PAGE',
      tid: '_THREAD_ID_',
      issued_at: 1234567890,
      page_id: '_PAGE_ID_',
    });

    expect(channel.platform).toBe('messenger');
    expect(channel.type).toBe('USER_TO_PAGE');
    expect(channel.subtype).toBe('psid');
    expect(channel.uid).toBe('messenger:_PAGE_ID_:psid:_THREAD_ID_');

    expect(channel.identifier).toBe('_THREAD_ID_');
    expect(channel.threadType).toBe('USER_TO_PAGE');
    expect(channel.targetType).toBe('psid');
    expect(channel.target).toEqual({ id: '_THREAD_ID_' });
    expect(channel.sendable).toBe(true);
  });

  test('within user to user thread', () => {
    const channel = MessengerChannel.fromExtensionContext({
      psid: '_USER_PSID_',
      algorithm: 'sha256',
      thread_type: 'USER_TO_USER',
      tid: '_THREAD_ID_',
      issued_at: 1234567890,
      page_id: '_PAGE_ID_',
    });

    expect(channel.platform).toBe('messenger');
    expect(channel.type).toBe('USER_TO_USER');
    expect(channel.subtype).toBe('psid');
    expect(channel.uid).toBe('messenger:_PAGE_ID_:psid:_THREAD_ID_');

    expect(channel.identifier).toBe('_THREAD_ID_');
    expect(channel.threadType).toBe('USER_TO_USER');
    expect(channel.targetType).toBe('psid');
    expect(channel.target).toEqual(null);
    expect(channel.sendable).toBe(false);
  });

  test('within group', () => {
    const channel = MessengerChannel.fromExtensionContext({
      psid: '_USER_PSID_',
      algorithm: 'sha256',
      thread_type: 'GROUP',
      tid: '_THREAD_ID_',
      issued_at: 1234567890,
      page_id: '_PAGE_ID_',
    });

    expect(channel.platform).toBe('messenger');
    expect(channel.type).toBe('GROUP');
    expect(channel.subtype).toBe('psid');
    expect(channel.uid).toBe('messenger:_PAGE_ID_:psid:_THREAD_ID_');

    expect(channel.identifier).toBe('_THREAD_ID_');
    expect(channel.threadType).toBe('GROUP');
    expect(channel.targetType).toBe('psid');
    expect(channel.target).toEqual(null);
    expect(channel.sendable).toBe(false);
  });
});
