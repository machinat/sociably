import WhatsAppAgent from '../Agent.js';

test('attributes', () => {
  const user = new WhatsAppAgent('1234567890');

  expect(user.platform).toBe('whatsapp');
  expect(user.id).toBe('1234567890');

  expect(user.uid).toMatchInlineSnapshot(`"wa.1234567890"`);
  expect(user.uniqueIdentifier).toMatchInlineSnapshot(`
    {
      "id": "1234567890",
      "platform": "whatsapp",
    }
  `);
});

test('marshallable', () => {
  const user = new WhatsAppAgent('1234567890');

  expect(user.typeName()).toBe('WaAgent');
  expect(user.toJSONValue()).toMatchInlineSnapshot(`
    {
      "id": "1234567890",
    }
  `);

  expect(WhatsAppAgent.fromJSONValue(user.toJSONValue())).toStrictEqual(
    new WhatsAppAgent('1234567890'),
  );
});
