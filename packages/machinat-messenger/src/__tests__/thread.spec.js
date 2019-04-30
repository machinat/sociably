import MessengerThread from '../thread';

test('with user id', () => {
  const thread = new MessengerThread({ id: 'foo' });

  expect(thread.platform).toBe('messenger');
  expect(thread.type).toBe('chat');
  expect(thread.subtype).toBe('user');
  expect(thread.allowPause).toBe(true);
  expect(thread.uid).toBe('messenger:default:user:foo');
});

test('with user id', () => {
  const thread = new MessengerThread({ id: 'foo' });

  expect(thread.platform).toBe('messenger');
  expect(thread.type).toBe('chat');
  expect(thread.subtype).toBe('user');
  expect(thread.allowPause).toBe(true);
  expect(thread.uid).toBe('messenger:default:user:foo');
});

test('with user_ref', () => {
  const thread = new MessengerThread({ user_ref: 'bar' });

  expect(thread.platform).toBe('messenger');
  expect(thread.type).toBe('chat');
  expect(thread.subtype).toBe('user');
  expect(thread.allowPause).toBe(true);
  expect(thread.uid).toBe('messenger:default:user_ref:bar');
});

test('with phone_number', () => {
  const thread = new MessengerThread({ phone_number: '+88888888888' });

  expect(thread.platform).toBe('messenger');
  expect(thread.type).toBe('chat');
  expect(thread.subtype).toBe('user');
  expect(thread.allowPause).toBe(true);
  // the phone number is hashed to hide personal info
  expect(thread.uid).toMatchInlineSnapshot(
    `"messenger:default:phone_number:nRn5C+EX4/vdk02aEWYs2zV5sHM="`
  );
});
