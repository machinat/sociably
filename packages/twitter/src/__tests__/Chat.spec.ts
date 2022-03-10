import TwitterChat from '../Chat';

test('with id only', () => {
  const user = new TwitterChat('1234567890', '9876543210');

  expect(user.agentId).toBe('1234567890');
  expect(user.id).toBe('9876543210');
  expect(user.uid).toBe('twitter.1234567890.9876543210');

  expect(user.typeName()).toBe('TwitterChat');
  expect(user.toJSONValue()).toEqual({
    agentId: '1234567890',
    id: '9876543210',
  });
});

test('marshall type metadata', () => {
  expect(TwitterChat.typeName).toBe('TwitterChat');

  expect(
    TwitterChat.fromJSONValue({ agentId: '1234567890', id: '9876543210' })
  ).toStrictEqual(new TwitterChat('1234567890', '9876543210'));
});
