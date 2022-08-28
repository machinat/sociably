import WhatsAppChat from '../Chat';
import WhatsAppUser from '../User';

test('constructing', () => {
  const chat = new WhatsAppChat('1234567890', '9876543210');

  expect(chat.platform).toBe('whatsapp');
  expect(chat.typeName()).toBe('WhatsAppChat');
  expect(chat.uid).toMatchInlineSnapshot(`"whatsapp.1234567890.9876543210"`);

  expect(chat.businessNumber).toBe('1234567890');
  expect(chat.customerNumber).toBe('9876543210');

  expect(chat.toJSONValue()).toMatchInlineSnapshot(`
    Object {
      "business": "1234567890",
      "customer": "9876543210",
    }
  `);
  expect(WhatsAppChat.fromJSONValue(chat.toJSONValue())).toStrictEqual(chat);
});

test('from user', () => {
  expect(
    WhatsAppChat.fromUser('1234567890', new WhatsAppUser('9876543210'))
  ).toEqual(new WhatsAppChat('1234567890', '9876543210'));
});
