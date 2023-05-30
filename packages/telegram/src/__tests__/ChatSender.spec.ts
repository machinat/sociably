import TelegramChatSender from '../ChatSender.js';
import TelegramChatProfile from '../ChatProfile.js';

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
  expect(sender.profile).toStrictEqual(new TelegramChatProfile(data));

  expect(sender.uid).toMatchInlineSnapshot(`"tg.12345"`);
  expect(sender.uniqueIdentifier).toMatchInlineSnapshot(`
    {
      "$$typeof": [
        "user",
      ],
      "id": 12345,
      "platform": "telegram",
    }
  `);

  expect(sender.typeName()).toBe('TgChatSender');
  expect(sender.toJSONValue()).toMatchInlineSnapshot(`
    {
      "id": 12345,
      "type": "supergroup",
    }
  `);
});
