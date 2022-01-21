import TelegramChatTarget from '../ChatTarget';

test('TelegramChatTarget', () => {
  const idTarget = new TelegramChatTarget(12345, 67890);

  expect(idTarget.platform).toBe('telegram');
  expect(idTarget.botId).toBe(12345);
  expect(idTarget.id).toBe(67890);
  expect(idTarget.type).toBe('unknown');
  expect(idTarget.uid).toMatchInlineSnapshot(`"telegram.12345.67890"`);

  const channelTarget = new TelegramChatTarget(12345, '@foo_channel');

  expect(channelTarget.platform).toBe('telegram');
  expect(channelTarget.botId).toBe(12345);
  expect(channelTarget.id).toBe('@foo_channel');
  expect(channelTarget.type).toBe('unknown');
  expect(channelTarget.uid).toMatchInlineSnapshot(
    `"telegram.12345.@foo_channel"`
  );

  expect(channelTarget.typeName()).toBe('TelegramChatTarget');
  expect(channelTarget.toJSONValue()).toMatchInlineSnapshot(`
    Object {
      "botId": 12345,
      "id": "@foo_channel",
    }
  `);
  expect(
    TelegramChatTarget.fromJSONValue(channelTarget.toJSONValue())
  ).toStrictEqual(channelTarget);
});
