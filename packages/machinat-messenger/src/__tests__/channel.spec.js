import MessengerUser from '../user';
import MessengerChannel from '../channel';

test('from id', () => {
  const channel = new MessengerChannel('_PAGE_ID_', { id: '_PSID_' });

  expect(channel.platform).toBe('messenger');
  expect(channel.uid).toMatchInlineSnapshot(
    `"messenger._PAGE_ID_.psid._PSID_"`
  );

  expect(channel.identifier).toBe('_PSID_');
  expect(channel.threadType).toBe('USER_TO_PAGE');
  expect(channel.targetType).toBe('psid');
  expect(channel.target).toEqual({ id: '_PSID_' });
});

test('from user_ref', () => {
  const channel = new MessengerChannel('_PAGE_ID_', { user_ref: '_USER_REF_' });

  expect(channel.platform).toBe('messenger');
  expect(channel.uid).toMatchInlineSnapshot(
    `"messenger._PAGE_ID_.user_ref._USER_REF_"`
  );

  expect(channel.identifier).toBe('_USER_REF_');
  expect(channel.threadType).toBe('USER_TO_PAGE');
  expect(channel.targetType).toBe('user_ref');
  expect(channel.target).toEqual({ user_ref: '_USER_REF_' });
});

test('from phone_number', () => {
  const channel = new MessengerChannel('_PAGE_ID_', {
    phone_number: '+88888888888',
    name: { first_name: 'jojo', last_name: 'doe' },
  });

  expect(channel.platform).toBe('messenger');
  expect(channel.uid).toMatchInlineSnapshot(
    `"messenger._PAGE_ID_.phone_number.nRn5C+EX4/vdk02aEWYs2zV5sHM="`
  );

  expect(channel.identifier).toBe('nRn5C+EX4/vdk02aEWYs2zV5sHM=');
  expect(channel.threadType).toBe('USER_TO_PAGE');
  expect(channel.targetType).toBe('phone_number');
  expect(channel.target).toEqual({
    phone_number: '+88888888888',
    name: { first_name: 'jojo', last_name: 'doe' },
  });
});

test('from post_id', () => {
  const channel = new MessengerChannel('_PAGE_ID_', { post_id: '_POST_ID_' });

  expect(channel.platform).toBe('messenger');
  expect(channel.uid).toMatchInlineSnapshot(
    `"messenger._PAGE_ID_.post_id._POST_ID_"`
  );

  expect(channel.identifier).toBe('_POST_ID_');
  expect(channel.threadType).toBe('USER_TO_PAGE');
  expect(channel.targetType).toBe('post_id');
  expect(channel.target).toEqual({ post_id: '_POST_ID_' });
});

test('from comment_id', () => {
  const channel = new MessengerChannel('_PAGE_ID_', {
    comment_id: '_COMMENT_ID_',
  });

  expect(channel.platform).toBe('messenger');
  expect(channel.uid).toMatchInlineSnapshot(
    `"messenger._PAGE_ID_.comment_id._COMMENT_ID_"`
  );

  expect(channel.identifier).toBe('_COMMENT_ID_');
  expect(channel.threadType).toBe('USER_TO_PAGE');
  expect(channel.targetType).toBe('comment_id');
  expect(channel.target).toEqual({ comment_id: '_COMMENT_ID_' });
});

test('MessengerChannel.fromUser()', () => {
  const user = new MessengerUser('_PAGE_ID_', '_USER_ID_');

  expect(MessengerChannel.fromUser(user)).toEqual(
    new MessengerChannel('_PAGE_ID_', { id: '_USER_ID_' }, 'USER_TO_PAGE')
  );
});
