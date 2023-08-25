import LineUser from '../User.js';

test('preperties', () => {
  const user = new LineUser('_PROVIDER_ID_', '_USER_ID_');

  expect(user.platform).toBe('line');
  expect(user.providerId).toBe('_PROVIDER_ID_');
  expect(user.id).toBe('_USER_ID_');
  expect(user.uid).toMatchInlineSnapshot(`"line._PROVIDER_ID_._USER_ID_"`);

  expect(user.uniqueIdentifier).toMatchInlineSnapshot(`
    {
      "id": "_USER_ID_",
      "platform": "line",
      "scopeId": "_PROVIDER_ID_",
    }
  `);
});

test('marshallable', () => {
  const user = new LineUser('_PROVIDER_ID_', '_USER_ID_');

  expect(user.typeName()).toBe('LineUser');
  expect(user.toJSONValue()).toMatchInlineSnapshot(`
    {
      "id": "_USER_ID_",
      "provider": "_PROVIDER_ID_",
    }
  `);
  expect(LineUser.fromJSONValue(user.toJSONValue())).toStrictEqual(user);
});
