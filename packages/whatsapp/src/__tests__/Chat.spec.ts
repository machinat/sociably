import WhatsAppChat from '../Chat';
import WhatsAppUser from '../User';

test('constructing', () => {
  const chat = new WhatsAppChat('1234567890', '9876543210');

  expect(chat.platform).toBe('whatsapp');
  expect(chat.typeName()).toBe('WaChat');

  expect(chat.uid).toMatchInlineSnapshot(`"wa.1234567890.9876543210"`);
  expect(chat.uniqueIdentifier).toMatchInlineSnapshot(`
    Object {
      "$$typeof": Array [
        "thread",
      ],
      "id": "9876543210",
      "platform": "whatsapp",
      "scopeId": "1234567890",
    }
  `);

  expect(chat.agentNumberId).toBe('1234567890');
  expect(chat.userNumberId).toBe('9876543210');

  expect(chat.toJSONValue()).toMatchInlineSnapshot(`
    Object {
      "agent": "1234567890",
      "user": "9876543210",
    }
  `);
  expect(WhatsAppChat.fromJSONValue(chat.toJSONValue())).toStrictEqual(chat);
});

test('from user', () => {
  expect(
    WhatsAppChat.fromUser('1234567890', new WhatsAppUser('9876543210'))
  ).toEqual(new WhatsAppChat('1234567890', '9876543210'));
});
