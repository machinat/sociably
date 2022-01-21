import LineUser from '../User';

test('preperties', () => {
  const user = new LineUser('_PROVIDER_ID_', '_USER_ID_');

  expect(user.platform).toBe('line');
  expect(user.providerId).toBe('_PROVIDER_ID_');
  expect(user.id).toBe('_USER_ID_');
  expect(user.uid).toMatchInlineSnapshot(`"line._PROVIDER_ID_._USER_ID_"`);
});

test('marshallable', () => {
  const user = new LineUser('_PROVIDER_ID_', '_USER_ID_');

  expect(user.typeName()).toBe('LineUser');
  expect(user.toJSONValue()).toMatchInlineSnapshot(`
    Object {
      "id": "_USER_ID_",
      "providerId": "_PROVIDER_ID_",
    }
  `);
  expect(LineUser.fromJSONValue(user.toJSONValue())).toStrictEqual(user);
});
