import TwitterUser from '../User';
import TwitterChat from '../Chat';

test('with id only', () => {
  const chat = new TwitterChat('1234567890', '9876543210');

  expect(chat.agentId).toBe('1234567890');
  expect(chat.userId).toBe('9876543210');

  expect(chat.agent).toEqual(new TwitterUser('1234567890'));
  expect(chat.user).toEqual(new TwitterUser('9876543210'));

  expect(chat.uid).toBe('twtr.1234567890.9876543210');
  expect(chat.uniqueIdentifier).toMatchInlineSnapshot(`
    Object {
      "$$typeof": Array [
        "thread",
      ],
      "id": "9876543210",
      "platform": "twitter",
      "scopeId": "1234567890",
    }
  `);

  expect(chat.typeName()).toBe('TwtrChat');
  expect(chat.toJSONValue()).toEqual({
    agent: '1234567890',
    user: '9876543210',
  });
});

test('marshall type metadata', () => {
  expect(TwitterChat.typeName).toBe('TwtrChat');

  expect(
    TwitterChat.fromJSONValue({ agent: '1234567890', user: '9876543210' })
  ).toStrictEqual(new TwitterChat('1234567890', '9876543210'));
});
