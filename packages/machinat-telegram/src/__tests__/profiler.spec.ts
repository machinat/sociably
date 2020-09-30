import { Readable } from 'stream';
import moxy from '@moxyjs/moxy';
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
  it('return profile object to fit the base interface', async () => {
    const profiler = new TelegramProfiler(bot);

    const userProfile1 = await profiler.getUserProfile(
      new TelegramUser({
        id: 12345,
        is_bot: false,
        first_name: 'Jane',
        last_name: 'Doe',
        username: 'janedoe',
      })
    );
    expect(userProfile1.platform).toBe('telegram');
    expect(userProfile1.id).toBe(12345);
    expect(userProfile1.name).toBe('Jane Doe');
    expect(userProfile1.firstName).toBe('Jane');
    expect(userProfile1.lastName).toBe('Doe');

    const userProfile2 = await profiler.getUserProfile(
      new TelegramUser({
        id: 12345,
        is_bot: false,
        first_name: 'John',
      })
    );
    expect(userProfile2.platform).toBe('telegram');
    expect(userProfile2.id).toBe(12345);
    expect(userProfile2.name).toBe('John');
    expect(userProfile2.firstName).toBe('John');
    expect(userProfile2.lastName).toBe(undefined);
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

  it('fetch the file and return the stream and info', async () => {
    bot.dispatchAPICall.mock.fake(async () => getUserProfilePhotosResult);
    const profiler = new TelegramProfiler(bot);
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
    expect(bot.fetchFile.mock).toHaveBeenCalledWith('_FILE_L_');

    expect(content).toBeInstanceOf(Readable);
    expect(content.read(100)).toBe('__BINARY_DATA__');
    expect(contentType).toBe('image/jpeg');
    expect(contentLength).toBe(6666);
    expect(width).toBe(600);
    expect(height).toBe(600);
  });

  it('fetch with minWidth option', async () => {
    bot.dispatchAPICall.mock.fake(async () => getUserProfilePhotosResult);
    const profiler = new TelegramProfiler(bot);
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
    const profiler = new TelegramProfiler(bot);
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

    const profiler = new TelegramProfiler(bot);

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

    const profiler = new TelegramProfiler(bot);

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
    const profiler = new TelegramProfiler(bot);
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
    const profiler = new TelegramProfiler(bot);

    bot.dispatchAPICall.mock.fakeReturnValue({
      ok: true,
      result: { id: 12345, type: 'group', title: 'FOO' },
    });

    await expect(profiler.fetchChatPhoto(12345)).resolves.toBe(null);
  });
});

describe('.photoDataURI(photoResponse)', () => {
  it('fetch the file and return the data URI', async () => {
    await expect(
      TelegramProfiler.photoDataURI({
        content: Readable.from('__BINARY_DATA__'),
        contentType: 'image/jpeg',
        contentLength: 7777,
        width: 600,
        height: 400,
      })
    ).resolves.toMatchInlineSnapshot(
      `"data:image/jpeg;base64,X19CSU5BUllfREFUQV9f"`
    );
  });
});
