import MessengerUser from '../user';

test('properties', () => {
  const user = new MessengerUser('_PAGE_ID_', 'foo');

  expect(user.platform).toBe('messenger');
  expect(user.pageId).toBe('_PAGE_ID_');
  expect(user.id).toBe('foo');
  expect(user.uid).toMatchInlineSnapshot(`"messenger._PAGE_ID_.foo"`);
});

test('marshallable', () => {
  const user = new MessengerUser('_PAGE_ID_', 'foo');

  expect(user.typeName()).toBe('MessengerUser');
  expect(user.toJSONValue()).toMatchInlineSnapshot(`
    Object {
      "pageId": "_PAGE_ID_",
      "psid": "foo",
    }
  `);

  expect(MessengerUser.fromJSONValue(user.toJSONValue())).toStrictEqual(user);
});
