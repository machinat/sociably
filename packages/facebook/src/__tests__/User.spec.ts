import User from '../User';

test('properties', () => {
  const user = new User('1234567890', 'foo');

  expect(user.platform).toBe('facebook');
  expect(user.pageId).toBe('1234567890');
  expect(user.id).toBe('foo');
  expect(user.uid).toMatchInlineSnapshot(`"fb.1234567890.foo"`);

  expect(user.uniqueIdentifier).toMatchInlineSnapshot(`
    Object {
      "id": "foo",
      "platform": "facebook",
      "scopeId": "1234567890",
    }
  `);
});

test('marshallable', () => {
  const user = new User('1234567890', 'foo');

  expect(user.typeName()).toBe('FbUser');
  expect(user.toJSONValue()).toMatchInlineSnapshot(`
    Object {
      "id": "foo",
      "page": "1234567890",
    }
  `);

  expect(User.fromJSONValue(user.toJSONValue())).toStrictEqual(user);
});