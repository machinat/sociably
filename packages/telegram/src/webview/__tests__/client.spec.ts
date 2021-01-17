import TelegramClientAuthorizer from '../client';
import { TelegramChat } from '../../channel';
import TelegramUser from '../../user';

const authorizer = new TelegramClientAuthorizer();

test('#init() do nothing', async () => {
  await expect(authorizer.init()).resolves.toBe(undefined);
});

test('#fetchCredential() return not ok', async () => {
  await expect(authorizer.fetchCredential()).resolves.toMatchInlineSnapshot(`
          Object {
            "code": 400,
            "reason": "should only initiate from backend",
            "success": false,
          }
        `);
});

test('#supplementContext()', async () => {
  const authData = {
    botId: 12345,
    channel: null,
    user: {
      id: 12345,
      first_name: 'Jojo',
      last_name: 'Doe',
      username: 'jojodoe',
    },
    photoUrl: 'http://crazy.dm/stand.png',
    chat: undefined,
  };

  const expectedUser = new TelegramUser(12345, {
    id: 12345,
    is_bot: false,
    first_name: 'Jojo',
    last_name: 'Doe',
    username: 'jojodoe',
  });

  await expect(authorizer.supplementContext(authData)).resolves.toEqual({
    botId: 12345,
    user: expectedUser,
    channel: new TelegramChat(12345, {
      type: 'private',
      id: 12345,
      first_name: 'Jojo',
      last_name: 'Doe',
      username: 'jojodoe',
    }),
    photoUrl: 'http://crazy.dm/stand.png',
  });
  await expect(
    authorizer.supplementContext({
      ...authData,
      chat: { type: 'group', id: 67890 },
    })
  ).resolves.toEqual({
    botId: 12345,
    user: expectedUser,
    channel: new TelegramChat(12345, { type: 'group', id: 67890 }),
    photoUrl: 'http://crazy.dm/stand.png',
  });
});
