import TweetTarget from '../TweetTarget';

test('with no reply tweet', () => {
  const user = new TweetTarget('1234567890');

  expect(user.agentId).toBe('1234567890');
  expect(user.tweetId).toBe(undefined);
  expect(user.uid).toBe('twtr.1234567890.-');
  expect(user.uniqueIdentifier).toMatchInlineSnapshot(`
    Object {
      "id": "-",
      "platform": "twitter",
      "scopeId": "1234567890",
    }
  `);

  expect(user.typeName()).toBe('TwtrTweetTarget');
  expect(user.toJSONValue()).toEqual({ agent: '1234567890' });
});

test('with reply tweet id', () => {
  const user = new TweetTarget('1234567890', '1111111111');

  expect(user.agentId).toBe('1234567890');
  expect(user.tweetId).toBe('1111111111');
  expect(user.uid).toBe('twtr.1234567890.1111111111');
  expect(user.uniqueIdentifier).toMatchInlineSnapshot(`
    Object {
      "id": "1111111111",
      "platform": "twitter",
      "scopeId": "1234567890",
    }
  `);

  expect(user.typeName()).toBe('TwtrTweetTarget');
  expect(user.toJSONValue()).toEqual({
    agent: '1234567890',
    tweet: '1111111111',
  });
});

test('marshall type metadata', () => {
  expect(TweetTarget.typeName).toBe('TwtrTweetTarget');

  expect(
    TweetTarget.fromJSONValue({ agent: '1234567890', tweet: '1111111111' })
  ).toStrictEqual(new TweetTarget('1234567890', '1111111111'));

  expect(TweetTarget.fromJSONValue({ agent: '1234567890' })).toStrictEqual(
    new TweetTarget('1234567890')
  );
});
