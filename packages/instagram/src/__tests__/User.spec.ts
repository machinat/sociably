import InstagramUser from '../User.js';

test('properties', () => {
  const user = new InstagramUser('1234567890', 'foo');

  expect(user.platform).toBe('instagram');
  expect(user.pageId).toBe('1234567890');
  expect(user.id).toBe('foo');
  expect(user.uid).toMatchInlineSnapshot(`"ig.1234567890.foo"`);

  expect(user.uniqueIdentifier).toMatchInlineSnapshot(`
    {
      "$$typeof": [
        "user",
      ],
      "id": "foo",
      "platform": "instagram",
      "scopeId": "1234567890",
    }
  `);
});

test('marshallable', () => {
  const user = new InstagramUser('1234567890', 'foo');

  expect(user.typeName()).toBe('IgUser');
  expect(user.toJSONValue()).toMatchInlineSnapshot(`
    {
      "id": "foo",
      "page": "1234567890",
    }
  `);

  expect(InstagramUser.fromJSONValue(user.toJSONValue())).toStrictEqual(user);
});
