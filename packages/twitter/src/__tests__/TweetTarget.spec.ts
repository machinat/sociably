import TweetTarget from '../TweetTarget';

test('with id only', () => {
  const user = new TweetTarget('1234567890', '1111111111');

  expect(user.agentId).toBe('1234567890');
  expect(user.id).toBe('1111111111');
  expect(user.uid).toBe('twitter.1234567890.1111111111');

  expect(user.typeName()).toBe('TweetTarget');
  expect(user.toJSONValue()).toEqual({
    agentId: '1234567890',
    id: '1111111111',
  });
});

test('marshall type metadata', () => {
  expect(TweetTarget.typeName).toBe('TweetTarget');

  expect(
    TweetTarget.fromJSONValue({ agentId: '1234567890', id: '1111111111' })
  ).toStrictEqual(new TweetTarget('1234567890', '1111111111'));
});
