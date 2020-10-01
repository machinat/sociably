import {
  TelegramChat,
  TelegramChatInstance,
  TelegramChatTarget,
} from '../channel';

test('TelegramChat contain correct informations', () => {
  const privateChat = new TelegramChat(12345, {
    id: 67890,
    type: 'private',
    username: 'John Doe',
    first_name: 'John',
    last_name: 'Doe',
  });

  expect(privateChat.platform).toBe('telegram');
  expect(privateChat.botId).toBe(12345);
  expect(privateChat.id).toBe(67890);
  expect(privateChat.type).toBe('private');
  expect(privateChat.title).toBe(undefined);
  expect(privateChat.username).toBe('John Doe');
  expect(privateChat.uid).toMatchInlineSnapshot(`"telegram.12345.67890"`);

  const groupChat = new TelegramChat(12345, {
    id: 67890,
    type: 'group',
    title: 'Foo',
  });

  expect(groupChat.platform).toBe('telegram');
  expect(groupChat.botId).toBe(12345);
  expect(groupChat.id).toBe(67890);
  expect(groupChat.type).toBe('group');
  expect(groupChat.title).toBe('Foo');
  expect(groupChat.username).toBe(undefined);
  expect(groupChat.uid).toMatchInlineSnapshot(`"telegram.12345.67890"`);
});

test('TelegramChatInstance contain correct informations', () => {
  const chatInstance = new TelegramChatInstance(12345, '_CHAT_INSTANCE_ID_');

  expect(chatInstance.platform).toBe('telegram');
  expect(chatInstance.botId).toBe(12345);
  expect(chatInstance.id).toBe('_CHAT_INSTANCE_ID_');
  expect(chatInstance.type).toBe('chat_instance');
  expect(chatInstance.uid).toMatchInlineSnapshot(
    `"telegram.12345._CHAT_INSTANCE_ID_"`
  );
});

test('TelegramChatTarget contain correct informations', () => {
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
});
