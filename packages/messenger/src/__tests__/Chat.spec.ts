import User from '../User';
import Chat from '../Chat';

test('from id', () => {
  const chat = new Chat('12345', '67890');

  expect(chat.platform).toBe('messenger');
  expect(chat.typeName()).toBe('FacebookChat');
  expect(chat.uid).toMatchInlineSnapshot(`"facebook.12345.67890"`);

  expect(chat.id).toBe('67890');
  expect(chat.type).toBe('psid');
  expect(chat.target).toEqual({ id: '67890' });

  expect(chat.toJSONValue()).toMatchInlineSnapshot(`
    Object {
      "id": "67890",
      "page": "12345",
    }
  `);
  expect(Chat.fromJSONValue(chat.toJSONValue())).toStrictEqual(chat);
});

test('from user', () => {
  const user = new User('12345', '67890');

  expect(Chat.fromUser(user)).toEqual(new Chat('12345', '67890'));
});
