import InstagramUser from '../User.js';

test('properties', () => {
  const user = new InstagramUser('1234567890', 'foo');

  expect(user.platform).toBe('instagram');
  expect(user.agentId).toBe('1234567890');
  expect(user.id).toBe('foo');
  expect(user.uid).toMatchInlineSnapshot(`"ig.1234567890.foo"`);

  expect(user.uniqueIdentifier).toMatchInlineSnapshot(`
    {
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
      "agent": "1234567890",
      "id": "foo",
    }
  `);

  expect(InstagramUser.fromJSONValue(user.toJSONValue())).toStrictEqual(user);
});
