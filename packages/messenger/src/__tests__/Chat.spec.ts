import MessengerUser from '../User';
import MessengerChat from '../Chat';

test('from id', () => {
  const chat = new MessengerChat('12345', '67890');

  expect(chat.platform).toBe('messenger');
  expect(chat.typeName()).toBe('MessengerChat');
  expect(chat.uid).toMatchInlineSnapshot(`"messenger.12345.id.67890"`);

  expect(chat.id).toBe('67890');
  expect(chat.type).toBe('id');
  expect(chat.target).toEqual({ id: '67890' });

  expect(chat.toJSONValue()).toMatchInlineSnapshot(`
    Object {
      "id": "67890",
      "page": "12345",
    }
  `);
  expect(MessengerChat.fromJSONValue(chat.toJSONValue())).toStrictEqual(chat);
});

test('from user', () => {
  const user = new MessengerUser('12345', '67890');

  expect(MessengerChat.fromUser(user)).toEqual(
    new MessengerChat('12345', '67890')
  );
});
