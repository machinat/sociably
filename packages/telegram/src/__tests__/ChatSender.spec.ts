import TelegramChatSender from '../ChatSender';
import TelegramChatProfile from '../ChatProfile';

test('marshallable type meta', () => {
  expect(TelegramChatSender.typeName).toBe('TgChatSender');
  expect(
    TelegramChatSender.fromJSONValue({ type: 'channel', id: 12345 })
  ).toEqual(new TelegramChatSender({ type: 'channel', id: 12345 }));
});

test('supergroup sender', () => {
  const data = {
    id: 12345,
    type: 'supergroup' as const,
    title: "I'm a Super Group",
  };
  const sender = new TelegramChatSender(data);

  expect(sender.platform).toBe('telegram');
  expect(sender.id).toBe(12345);
  expect(sender.type).toBe('supergroup');
  expect(sender.data).toEqual(data);
  expect(sender.uid).toMatchInlineSnapshot(`"tg.12345"`);
  expect(sender.profile).toStrictEqual(new TelegramChatProfile(data));

  expect(sender.typeName()).toBe('TgChatSender');
  expect(sender.toJSONValue()).toMatchInlineSnapshot(`
      Object {
        "id": 12345,
        "type": "supergroup",
      }
    `);
});
