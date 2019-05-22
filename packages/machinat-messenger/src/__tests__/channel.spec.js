import MessengerChannel from '../channel';

test('with user id', () => {
  const channel = new MessengerChannel({ id: 'foo' });

  expect(channel.platform).toBe('messenger');
  expect(channel.type).toBe('chat');
  expect(channel.subtype).toBe('user');
  expect(channel.allowPause).toBe(true);
  expect(channel.uid).toBe('messenger:default:user:foo');
});

test('with user id', () => {
  const channel = new MessengerChannel({ id: 'foo' });

  expect(channel.platform).toBe('messenger');
  expect(channel.type).toBe('chat');
  expect(channel.subtype).toBe('user');
  expect(channel.allowPause).toBe(true);
  expect(channel.uid).toBe('messenger:default:user:foo');
});

test('with user_ref', () => {
  const channel = new MessengerChannel({ user_ref: 'bar' });

  expect(channel.platform).toBe('messenger');
  expect(channel.type).toBe('chat');
  expect(channel.subtype).toBe('user');
  expect(channel.allowPause).toBe(true);
  expect(channel.uid).toBe('messenger:default:user_ref:bar');
});

test('with phone_number', () => {
  const channel = new MessengerChannel({ phone_number: '+88888888888' });

  expect(channel.platform).toBe('messenger');
  expect(channel.type).toBe('chat');
  expect(channel.subtype).toBe('user');
  expect(channel.allowPause).toBe(true);
  // the phone number is hashed to hide personal info
  expect(channel.uid).toMatchInlineSnapshot(
    `"messenger:default:phone_number:nRn5C+EX4/vdk02aEWYs2zV5sHM="`
  );
});
