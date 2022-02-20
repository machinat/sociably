import TweetTarget from '../TweetTarget';

test('with id only', () => {
  const user = new TweetTarget('1234567890');

  expect(user.id).toBe('1234567890');
  expect(user.uid).toBe('twitter.tweet.1234567890');

  expect(user.typeName()).toBe('TweetTarget');
  expect(user.toJSONValue()).toEqual({ id: '1234567890' });
});

test('marshall type metadata', () => {
  expect(TweetTarget.typeName).toBe('TweetTarget');

  expect(TweetTarget.fromJSONValue({ id: '1234567890' })).toStrictEqual(
    new TweetTarget('1234567890')
  );
});
