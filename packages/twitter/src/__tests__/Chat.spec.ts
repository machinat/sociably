import TwitterChat from '../Chat';

test('with id only', () => {
  const user = new TwitterChat('6253282');

  expect(user.id).toBe('6253282');
  expect(user.uid).toBe('twitter.dm_user.6253282');

  expect(user.typeName()).toBe('TwitterChat');
  expect(user.toJSONValue()).toEqual({ id: '6253282' });
});

test('marshall type metadata', () => {
  expect(TwitterChat.typeName).toBe('TwitterChat');

  expect(TwitterChat.fromJSONValue({ id: '6253282' })).toStrictEqual(
    new TwitterChat('6253282')
  );
});
