import type { IncomingMessage } from 'http';
import moxy from '@moxyjs/moxy';
import type { ResponseHelper } from '@machinat/auth/types';
import type { TelegramBot } from '../../bot';
import { TelegramServerAuthorizer } from '../server';
import { TelegramChat } from '../../channel';
import TelegramUser from '../../user';
import TelegramApiError from '../../error';

const createReq = ({ url }) =>
  moxy<IncomingMessage>({
    method: 'GET',
    headers: {},
    url,
  } as never);

const res = {};

const resHelper = moxy<ResponseHelper>({
  async issueAuth() {},
  async issueError() {},
  redirect() {
    return '';
  },
} as never);

const bot = moxy<TelegramBot>({
  id: 12345,
  token: '12345:_BOT_TOKEN_',
  makeApiCall() {
    throw new Error();
  },
} as never);

const authorizer = new TelegramServerAuthorizer(bot);

beforeEach(() => {
  bot.mock.reset();
  resHelper.mock.reset();
});

const MockDate = moxy(Date);
MockDate.now.mock.fake(() => 1601136786000);
const _Date = Date;

beforeAll(() => {
  global.Date = MockDate;
});

afterAll(() => {
  global.Date = _Date;
});

describe('#delegateAuthRequest()', () => {
  const telegramLoginSearch = {
    id: '12345',
    auth_date: '1601136776',
    first_name: 'John',
    last_name: 'Doe',
    username: 'johndoe',
    photo_url: 'https://...',
    hash: 'e0aeac2cb5f34b930e6d83d16eecc5df1483c61eedf4ad07f3f43e55d6dd195d',
  };

  it('receive login request and redirct user to webview', async () => {
    const search = new URLSearchParams(telegramLoginSearch);

    const req = createReq({ url: `/auth/telegram/login?${search}` });
    await authorizer.delegateAuthRequest(req, res as never, resHelper);

    expect(resHelper.redirect.mock).toHaveBeenCalledTimes(1);
    expect(resHelper.redirect.mock).toHaveBeenCalledWith(undefined, {
      assertInternal: true,
    });

    expect(resHelper.issueError.mock).not.toHaveBeenCalled();
    expect(resHelper.issueAuth.mock).toHaveBeenCalledTimes(1);
    expect(resHelper.issueAuth.mock).toHaveBeenCalledWith({
      bot: 12345,
      chat: undefined,
      user: {
        id: 12345,
        first_name: 'John',
        last_name: 'Doe',
        username: 'johndoe',
      },
      photo: 'https://...',
    });
  });

  it('verify user is a chat member if telegramChat query param given', async () => {
    const search = new URLSearchParams({
      ...telegramLoginSearch,
      telegramChat: '23456',
    });

    const req = createReq({ url: `/auth/telegram/login?${search}` });

    // getChatMember
    bot.makeApiCall.mock.fakeOnce(async () => ({
      user: {
        id: 12345,
        first_name: 'John',
        last_name: 'Doe',
        username: 'johndoe',
        language_code: 'en-US',
      },
      status: 'member',
    }));

    // getChat
    bot.makeApiCall.mock.fakeOnce(async () => ({
      id: 23456,
      type: 'group',
      title: 'Does',
    }));

    await authorizer.delegateAuthRequest(req, res as never, resHelper);

    expect(bot.makeApiCall.mock).toHaveBeenCalledTimes(2);
    expect(bot.makeApiCall.mock).toHaveBeenNthCalledWith(1, 'getChatMember', {
      user_id: 12345,
      chat_id: 23456,
    });
    expect(bot.makeApiCall.mock).toHaveBeenNthCalledWith(2, 'getChat', {
      chat_id: 23456,
    });

    expect(resHelper.issueAuth.mock).toHaveBeenCalledTimes(1);
    expect(resHelper.issueAuth.mock).toHaveBeenCalledWith({
      bot: 12345,
      chat: {
        type: 'group',
        id: 23456,
        title: 'Does',
      },
      user: {
        id: 12345,
        first_name: 'John',
        last_name: 'Doe',
        username: 'johndoe',
        language_code: 'en-US',
      },
      photo: 'https://...',
    });
  });

  it('fail if user is not a member of telegramChat', async () => {
    const search = new URLSearchParams({
      ...telegramLoginSearch,
      telegramChat: '23456',
    });

    const req = createReq({ url: `/auth/telegram/login?${search}` });

    bot.makeApiCall.mock.fake(async () => {
      throw new TelegramApiError({
        ok: false,
        error_code: 400,
        description: 'Bad Request: user not found',
      });
    });

    await authorizer.delegateAuthRequest(req, res as never, resHelper);

    expect(bot.makeApiCall.mock).toHaveBeenCalledTimes(1);

    expect(resHelper.issueError.mock).toHaveBeenCalledTimes(1);
    expect(resHelper.issueError.mock.calls[0].args).toMatchInlineSnapshot(`
      Array [
        400,
        "Bad Request: user not found",
      ]
    `);
  });

  it('redirect to `redirectUrl` query param if specified', async () => {
    const search = new URLSearchParams({
      ...telegramLoginSearch,
      redirectUrl: '/webview/hello_world.html',
    });

    const req = createReq({ url: `/auth/telegram/login?${search}` });
    await authorizer.delegateAuthRequest(req, res as never, resHelper);

    expect(resHelper.redirect.mock).toHaveBeenCalledWith(
      '/webview/hello_world.html',
      {
        assertInternal: true,
      }
    );

    expect(resHelper.issueError.mock).not.toHaveBeenCalled();
    expect(resHelper.issueAuth.mock).toHaveBeenCalledTimes(1);
  });

  it('issue error if auth_date expired (20 second)', async () => {
    const search = new URLSearchParams({
      ...telegramLoginSearch,
      auth_date: '1601136765',
      hash: '6fe5c0198e70297fffec814bf443afef5d3f6587d722399816d808e61217e571',
    });

    const req = createReq({ url: `/auth/telegram/login?${search}` });
    await authorizer.delegateAuthRequest(req, res as never, resHelper);

    expect(resHelper.redirect.mock).toHaveBeenCalledWith(undefined, {
      assertInternal: true,
    });

    expect(resHelper.issueAuth.mock).not.toHaveBeenCalled();
    expect(resHelper.issueError.mock).toHaveBeenCalledTimes(1);
    expect(resHelper.issueError.mock.calls[0].args[0]).toBe(401);
    expect(resHelper.issueError.mock.calls[0].args[1]).toMatchInlineSnapshot(
      `"login expired"`
    );
  });

  it('issue error if hash invalid', async () => {
    const search = new URLSearchParams({
      ...telegramLoginSearch,
      hash: '_INVALID_HASH_',
    });

    const req = createReq({
      url: `/auth/telegram?${search}`,
    });
    await authorizer.delegateAuthRequest(req, res as never, resHelper);

    expect(resHelper.redirect.mock).toHaveBeenCalledWith(undefined, {
      assertInternal: true,
    });

    expect(resHelper.issueAuth.mock).not.toHaveBeenCalled();
    expect(resHelper.issueError.mock).toHaveBeenCalledTimes(1);
    expect(resHelper.issueError.mock.calls[0].args[0]).toBe(401);
    expect(resHelper.issueError.mock.calls[0].args[1]).toMatchInlineSnapshot(
      `"invalid login signature"`
    );
  });
});

test('#verifyCredential() simply return not ok', async () => {
  await expect(authorizer.verifyCredential()).resolves.toMatchInlineSnapshot(`
          Object {
            "code": 403,
            "reason": "should initiate st server side only",
            "success": false,
          }
        `);
});

describe('#verifyRefreshment()', () => {
  test('return success and original data', async () => {
    const authData = {
      bot: 12345,
      chat: {
        type: 'private' as const,
        id: 67890,
      },
      user: {
        id: 67890,
        first_name: 'Jojo',
        last_name: 'Doe',
        username: 'jojodoe',
      },
      photo: undefined,
    };
    await expect(authorizer.verifyRefreshment(authData)).resolves.toEqual({
      success: true,
      data: authData,
    });
  });

  it('return fail if botId not match', async () => {
    await expect(
      authorizer.verifyRefreshment({
        bot: 55555,
        chat: undefined,
        user: {
          id: 67890,
          first_name: 'Jojo',
          last_name: 'Doe',
          username: 'jojodoe',
        },
        photo: undefined,
      })
    ).resolves.toMatchInlineSnapshot(`
            Object {
              "code": 400,
              "reason": "bot not match",
              "success": false,
            }
          `);
  });
});

test('#supplementContext()', () => {
  const authData = {
    bot: 12345,
    user: {
      id: 67890,
      first_name: 'Jojo',
      last_name: 'Doe',
      username: 'jojodoe',
    },
    photo: 'http://crazy.dm/stand.png',
    chat: undefined,
  };

  const expectedUser = new TelegramUser(67890, {
    id: 67890,
    is_bot: false,
    first_name: 'Jojo',
    last_name: 'Doe',
    username: 'jojodoe',
  });

  expect(authorizer.checkAuthContext(authData)).toEqual({
    success: true,
    contextSupplment: {
      botId: 12345,
      user: expectedUser,
      channel: new TelegramChat(12345, {
        type: 'private',
        id: 67890,
        first_name: 'Jojo',
        last_name: 'Doe',
        username: 'jojodoe',
      }),
      photoUrl: 'http://crazy.dm/stand.png',
    },
  });

  expect(
    authorizer.checkAuthContext({
      ...authData,
      chat: { type: 'group', id: 98765 },
    })
  ).toEqual({
    success: true,
    contextSupplment: {
      botId: 12345,
      user: expectedUser,
      channel: new TelegramChat(12345, { type: 'group', id: 98765 }),
      photoUrl: 'http://crazy.dm/stand.png',
    },
  });
});
