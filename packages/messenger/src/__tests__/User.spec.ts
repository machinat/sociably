import User from '../User';

test('properties', () => {
  const user = new User('1234567890', 'foo');

  expect(user.platform).toBe('messenger');
  expect(user.pageId).toBe('1234567890');
  expect(user.id).toBe('foo');
  expect(user.uid).toMatchInlineSnapshot(`"facebook.1234567890.foo"`);
});

test('marshallable', () => {
  const user = new User('1234567890', 'foo');

  expect(user.typeName()).toBe('FacebookUser');
  expect(user.toJSONValue()).toMatchInlineSnapshot(`
    Object {
      "id": "foo",
      "page": "1234567890",
    }
  `);

  expect(User.fromJSONValue(user.toJSONValue())).toStrictEqual(user);
});
