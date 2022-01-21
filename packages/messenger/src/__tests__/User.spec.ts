import MessengerUser from '../User';

test('properties', () => {
  const user = new MessengerUser(1234567890, 'foo');

  expect(user.platform).toBe('messenger');
  expect(user.pageId).toBe(1234567890);
  expect(user.id).toBe('foo');
  expect(user.uid).toMatchInlineSnapshot(`"messenger.1234567890.foo"`);
});

test('marshallable', () => {
  const user = new MessengerUser(1234567890, 'foo');

  expect(user.typeName()).toBe('MessengerUser');
  expect(user.toJSONValue()).toMatchInlineSnapshot(`
    Object {
      "pageId": 1234567890,
      "psid": "foo",
    }
  `);

  expect(MessengerUser.fromJSONValue(user.toJSONValue())).toStrictEqual(user);
});
