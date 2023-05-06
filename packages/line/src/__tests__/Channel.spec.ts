import LineChannel from '../Channel';

test('preperties', () => {
  const user = new LineChannel('_CHANNEL_ID_');

  expect(user.platform).toBe('line');
  expect(user.id).toBe('_CHANNEL_ID_');
  expect(user.uid).toMatchInlineSnapshot(`"line._CHANNEL_ID_"`);

  expect(user.uniqueIdentifier).toMatchInlineSnapshot(`
    Object {
      "$$typeof": Array [
        "channel",
      ],
      "id": "_CHANNEL_ID_",
      "platform": "line",
    }
  `);
});

test('marshallable', () => {
  const user = new LineChannel('_CHANNEL_ID_');

  expect(user.typeName()).toBe('LineChannel');
  expect(user.toJSONValue()).toMatchInlineSnapshot(`
    Object {
      "id": "_CHANNEL_ID_",
    }
  `);
  expect(LineChannel.fromJSONValue(user.toJSONValue())).toStrictEqual(user);
});
