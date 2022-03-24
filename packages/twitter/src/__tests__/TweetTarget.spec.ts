import TweetTarget from '../TweetTarget';

test('with no reply tweet', () => {
  const user = new TweetTarget('1234567890');

  expect(user.agentId).toBe('1234567890');
  expect(user.tweetId).toBe(undefined);
  expect(user.uid).toBe('twitter.1234567890.-');

  expect(user.typeName()).toBe('TweetTarget');
  expect(user.toJSONValue()).toEqual({ agent: '1234567890' });
});

test('with reply tweet id', () => {
  const user = new TweetTarget('1234567890', '1111111111');

  expect(user.agentId).toBe('1234567890');
  expect(user.tweetId).toBe('1111111111');
  expect(user.uid).toBe('twitter.1234567890.1111111111');

  expect(user.typeName()).toBe('TweetTarget');
  expect(user.toJSONValue()).toEqual({
    agent: '1234567890',
    tweet: '1111111111',
  });
});

test('marshall type metadata', () => {
  expect(TweetTarget.typeName).toBe('TweetTarget');

  expect(
    TweetTarget.fromJSONValue({ agent: '1234567890', tweet: '1111111111' })
  ).toStrictEqual(new TweetTarget('1234567890', '1111111111'));

  expect(TweetTarget.fromJSONValue({ agent: '1234567890' })).toStrictEqual(
    new TweetTarget('1234567890')
  );
});
