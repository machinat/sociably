import { Readable } from 'stream';
import moxy from '@moxyjs/moxy';
import { InMemoryState } from '@machinat/simple-state';
import { TelegramProfiler } from '../profiler';
import { TelegramChat, TelegramChatTarget } from '../channel';
import TelegramUser from '../user';

const bot = moxy({
  async dispatchAPICall() {
    throw new Error();
  },
  async fetchFile() {
    return {
      content: Readable.from('__BINARY_DATA__'),
      contentType: 'image/jpeg',
      contentLength: 6666,
    };
  },
});

beforeEach(() => {
  bot.mock.reset();
});

describe('#getUserProfile(user)', () => {
  it('return profile when no state controller is provided', async () => {
    const profiler = new TelegramProfiler(bot, null);

    const profile = await profiler.getUserProfile(
      new TelegramUser({
        id: 12345,
        is_bot: false,
        first_name: 'Jane',
        last_name: 'Doe',
        username: 'janedoe',
      })
    );
    expect(profile.platform).toBe('telegram');
    expect(profile.id).toBe(12345);
    expect(profile.name).toBe('Jane Doe');
    expect(profile.firstName).toBe('Jane');
    expect(profile.lastName).toBe('Doe');
    expect(profile.pictureURL).toBe(undefined);
  });

  it('return profile with cached pictureURL', async () => {
    const stateContoller = new InMemoryState.Controller();
    const profiler = new TelegramProfiler(bot, stateContoller);

    const user = new TelegramUser({
      id: 12345,
      is_bot: false,
      first_name: 'John',
    });

    await profiler.cacheUserProfile(user, {
      pictureURL: 'http://john.doe/avatar',
    });

    const profile = await profiler.getUserProfile(user);
    expect(profile.platform).toBe('telegram');
    expect(profile.id).toBe(12345);
    expect(profile.name).toBe('John');
    expect(profile.firstName).toBe('John');
    expect(profile.lastName).toBe(undefined);
    expect(profile.pictureURL).toBe('http://john.doe/avatar');
  });

  it('ignore cached pictureURL if noAvatar option set to true', async () => {
    const stateContoller = new InMemoryState.Controller();
    const profiler = new TelegramProfiler(bot, stateContoller);

    const user = new TelegramUser({
      id: 12345,
      is_bot: false,
      first_name: 'John',
    });

    await profiler.cacheUserProfile(user, {
      pictureURL: 'http://john.doe/avatar',
    });

    const profile = await profiler.getUserProfile(user, { noAvatar: true });
    expect(profile.pictureURL).toBe(undefined);
  });

  it('return profile without pictureURL if not being cached', async () => {
    const stateContoller = new InMemoryState.Controller();
    const profiler = new TelegramProfiler(bot, stateContoller);

    const profile = await profiler.getUserProfile(
      new TelegramUser({
        id: 12345,
        is_bot: false,
        first_name: 'Jojo',
      })
    );
    expect(profile.platform).toBe('telegram');
    expect(profile.id).toBe(12345);
    expect(profile.name).toBe('Jojo');
    expect(profile.firstName).toBe('Jojo');
    expect(profile.lastName).toBe(undefined);
    expect(profile.pictureURL).toBe(undefined);
  });
});

describe('#getCachedUserProfile(user)', () => {
  it('throw if state controller is not provided', async () => {
    const profiler = new TelegramProfiler(bot, null);

    await expect(
      profiler.getCachedUserProfile(12345)
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `"should provide StateControllerI to cache profile"`
    );
  });

  it('return profile with cached pictureURL', async () => {
    const stateContoller = new InMemoryState.Controller();
    const profiler = new TelegramProfiler(bot, stateContoller);

    const user = new TelegramUser({
      id: 12345,
      is_bot: false,
      first_name: 'John',
    });

    await profiler.cacheUserProfile(user, {
      pictureURL: 'http://john.doe/avatar',
    });

    const profile: any = await profiler.getCachedUserProfile(12345);
    expect(profile.platform).toBe('telegram');
    expect(profile.id).toBe(12345);
    expect(profile.name).toBe('John');
    expect(profile.firstName).toBe('John');
    expect(profile.lastName).toBe(undefined);
    expect(profile.pictureURL).toBe('http://john.doe/avatar');
  });

  it('return null if not being cached', async () => {
    const stateContoller = new InMemoryState.Controller();
    const profiler = new TelegramProfiler(bot, stateContoller);

    await expect(profiler.getCachedUserProfile(12345)).resolves.toBe(null);
  });
});

describe('#cacheUserProfile(user)', () => {
  it('throw if state controller is not provided', async () => {
    const profiler = new TelegramProfiler(bot, null);
    const user = new TelegramUser({
      id: 12345,
      is_bot: false,
      first_name: 'John',
    });
    await expect(
      profiler.cacheUserProfile(user)
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `"should provide StateControllerI to cache profile"`
    );
  });

  it('cache user profile data', async () => {
    const stateContoller = new InMemoryState.Controller();
    const profiler = new TelegramProfiler(bot, stateContoller);
    const user = new TelegramUser({
      id: 12345,
      is_bot: false,
      first_name: 'Jane',
      last_name: 'Doe',
      username: 'janedoe',
    });

    let profile = await profiler.cacheUserProfile(user);
    expect(profile.platform).toBe('telegram');
    expect(profile.id).toBe(12345);
    expect(profile.name).toBe('Jane Doe');
    expect(profile.firstName).toBe('Jane');
    expect(profile.lastName).toBe('Doe');
    expect(profile.pictureURL).toBe(undefined);

    await expect(stateContoller.userState(user).getAll()).resolves
      .toMatchInlineSnapshot(`
            Map {
              "$$telegram:user:profile" => Object {
                "pictureURL": undefined,
                "user": Object {
                  "first_name": "Jane",
                  "id": 12345,
                  "is_bot": false,
                  "language_code": undefined,
                  "last_name": "Doe",
                  "username": "janedoe",
                },
              },
            }
          `);

    profile = await profiler.cacheUserProfile(user, {
      pictureURL: 'http://jane.doe/avatar',
    });
    expect(profile.pictureURL).toBe('http://jane.doe/avatar');

    await expect(stateContoller.userState(user).getAll()).resolves
      .toMatchInlineSnapshot(`
            Map {
              "$$telegram:user:profile" => Object {
                "pictureURL": "http://jane.doe/avatar",
                "user": Object {
                  "first_name": "Jane",
                  "id": 12345,
                  "is_bot": false,
                  "language_code": undefined,
                  "last_name": "Doe",
                  "username": "janedoe",
                },
              },
            }
          `);
  });
});

describe('#fetchUserPhoto(user)', () => {
  const getUserProfilePhotosResult = {
    ok: true,
    result: {
      total_count: 1,
      photos: [
        [
          {
            file_id: '_FILE_S_',
            file_unique_id: '_UNIQUE_ID_S_',
            file_size: 200000,
            width: 200,
            height: 200,
          },
          {
            file_id: '_FILE_M_',
            file_unique_id: '_UNIQUE_ID_M_',
            file_size: 400000,
            width: 400,
            height: 400,
          },
          {
            file_id: '_FILE_L_',
            file_unique_id: '_UNIQUE_ID_L_',
            file_size: 600000,
            width: 600,
            height: 600,
          },
        ],
      ],
    },
  };

  it('fetch the smallest file of the forst photo by default', async () => {
    bot.dispatchAPICall.mock.fake(async () => getUserProfilePhotosResult);
    const profiler = new TelegramProfiler(bot, null);
    const user = new TelegramUser({
      id: 12345,
      is_bot: false,
      first_name: 'John',
    });

    const {
      content,
      contentType,
      contentLength,
      width,
      height,
    }: any = await profiler.fetchUserPhoto(user);

    expect(bot.dispatchAPICall.mock).toHaveBeenCalledTimes(1);
    expect(
      bot.dispatchAPICall.mock
    ).toHaveBeenCalledWith('getUserProfilePhotos', { user_id: 12345 });
    expect(bot.fetchFile.mock).toHaveBeenCalledTimes(1);
    expect(bot.fetchFile.mock).toHaveBeenCalledWith('_FILE_S_');

    expect(content).toBeInstanceOf(Readable);
    expect(content.read(100)).toBe('__BINARY_DATA__');
    expect(contentType).toBe('image/jpeg');
    expect(contentLength).toBe(6666);
    expect(width).toBe(200);
    expect(height).toBe(200);
  });

  it('fetch with minWidth option', async () => {
    bot.dispatchAPICall.mock.fake(async () => getUserProfilePhotosResult);
    const profiler = new TelegramProfiler(bot, null);
    const user = new TelegramUser({
      id: 12345,
      is_bot: false,
      first_name: 'John',
    });

    await expect(
      profiler.fetchUserPhoto(user, { minWidth: 180 })
    ).resolves.toEqual({
      content: expect.any(Readable),
      contentType: 'image/jpeg',
      contentLength: 6666,
      width: 200,
      height: 200,
    });
    await expect(
      profiler.fetchUserPhoto(user, { minWidth: 380 })
    ).resolves.toEqual({
      content: expect.any(Readable),
      contentType: 'image/jpeg',
      contentLength: 6666,
      width: 400,
      height: 400,
    });
    await expect(
      profiler.fetchUserPhoto(user, { minWidth: 580 })
    ).resolves.toEqual({
      content: expect.any(Readable),
      contentType: 'image/jpeg',
      contentLength: 6666,
      width: 600,
      height: 600,
    });

    expect(bot.dispatchAPICall.mock).toHaveBeenCalledTimes(3);
    expect(bot.fetchFile.mock).toHaveBeenCalledTimes(3);
    expect(bot.fetchFile.mock).toHaveBeenNthCalledWith(1, '_FILE_S_');
    expect(bot.fetchFile.mock).toHaveBeenNthCalledWith(2, '_FILE_M_');
    expect(bot.fetchFile.mock).toHaveBeenNthCalledWith(3, '_FILE_L_');
  });

  it('return null if user has no profile photo', async () => {
    const profiler = new TelegramProfiler(bot, null);
    const user = new TelegramUser({
      id: 12345,
      is_bot: false,
      first_name: 'John',
    });

    bot.dispatchAPICall.mock.fakeReturnValue({
      ok: true,
      result: { total_count: 0, photos: [] },
    });

    await expect(profiler.fetchUserPhoto(user)).resolves.toBe(null);
  });
});

describe('#fetchChatPhoto(user)', () => {
  const getChatResult = {
    ok: true,
    result: {
      id: 12345,
      type: 'group',
      title: 'FOO',
      photo: {
        small_file_id: '_SMALL_FILE_ID_',
        small_file_unique_id: '_SMALL_UNIQUE_FILE_ID_',
        big_file_id: '_BIG_FILE_ID_',
        big_file_unique_id: '_BIG_UNIQUE_FILE_ID_',
      },
    },
  };

  it('fetch the file and return the stream and info', async () => {
    bot.dispatchAPICall.mock.fake(async () => getChatResult);

    const profiler = new TelegramProfiler(bot, null);

    const {
      content,
      contentType,
      contentLength,
      width,
      height,
    }: any = await profiler.fetchChatPhoto(12345);

    expect(bot.dispatchAPICall.mock).toHaveBeenCalledTimes(1);
    expect(bot.dispatchAPICall.mock).toHaveBeenCalledWith('getChat', {
      chat_id: 12345,
    });
    expect(bot.fetchFile.mock).toHaveBeenCalledTimes(1);
    expect(bot.fetchFile.mock).toHaveBeenCalledWith('_BIG_FILE_ID_');

    expect(content).toBeInstanceOf(Readable);
    expect(content.read(100)).toBe('__BINARY_DATA__');
    expect(contentType).toBe('image/jpeg');
    expect(contentLength).toBe(6666);
    expect(width).toBe(640);
    expect(height).toBe(640);
  });

  test('fetch small size', async () => {
    bot.dispatchAPICall.mock.fake(async () => getChatResult);

    const profiler = new TelegramProfiler(bot, null);

    await expect(
      profiler.fetchChatPhoto(12345, { size: 'small' })
    ).resolves.toEqual({
      content: expect.any(Readable),
      contentType: 'image/jpeg',
      contentLength: 6666,
      width: 160,
      height: 160,
    });

    expect(bot.dispatchAPICall.mock).toHaveBeenCalledTimes(1);
    expect(bot.dispatchAPICall.mock).toHaveBeenCalledWith('getChat', {
      chat_id: 12345,
    });
    expect(bot.fetchFile.mock).toHaveBeenCalledTimes(1);
    expect(bot.fetchFile.mock).toHaveBeenCalledWith('_SMALL_FILE_ID_');
  });

  it('fetch with chat object', async () => {
    bot.dispatchAPICall.mock.fake(async () => getChatResult);
    const profiler = new TelegramProfiler(bot, null);
    const expectedResponse = {
      content: expect.any(Readable),
      contentType: 'image/jpeg',
      contentLength: 6666,
      width: 640,
      height: 640,
    };

    await expect(
      profiler.fetchChatPhoto(
        new TelegramChat(12345, { id: 67890, type: 'group' })
      )
    ).resolves.toEqual(expectedResponse);

    await expect(
      profiler.fetchChatPhoto(new TelegramChatTarget(12345, '@foo_channel'))
    ).resolves.toEqual(expectedResponse);

    expect(bot.dispatchAPICall.mock).toHaveBeenCalledTimes(2);
    expect(bot.dispatchAPICall.mock).toHaveBeenCalledWith('getChat', {
      chat_id: 67890,
    });
    expect(bot.dispatchAPICall.mock).toHaveBeenCalledWith('getChat', {
      chat_id: '@foo_channel',
    });
    expect(bot.fetchFile.mock).toHaveBeenCalledTimes(2);
  });

  it('return null if chat has no photo', async () => {
    const profiler = new TelegramProfiler(bot, null);

    bot.dispatchAPICall.mock.fakeReturnValue({
      ok: true,
      result: { id: 12345, type: 'group', title: 'FOO' },
    });

    await expect(profiler.fetchChatPhoto(12345)).resolves.toBe(null);
  });
});
