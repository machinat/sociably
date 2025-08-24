import InstagramUser from '../User.js';

test('properties', () => {
  const user = new InstagramUser('1234567890', 'foo');

  expect(user.platform).toBe('instagram');
  expect(user.agentId).toBe('1234567890');
  expect(user.id).toBe('foo');
  expect(user.uid).toMatchInlineSnapshot(`"instagram.1234567890.foo"`);
});

test('marshallable', () => {
  const user = new InstagramUser('1234567890', 'foo');

  expect(user.typeName()).toBe('InstagramUser');
  expect(user.toJSONValue()).toMatchInlineSnapshot(`
    {
      "agent": "1234567890",
      "id": "foo",
    }
  `);

  expect(InstagramUser.fromJSONValue(user.toJSONValue())).toStrictEqual(user);
});
