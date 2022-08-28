import { makeClassProvider } from '@sociably/core/service';
import type { UserProfiler } from '@sociably/core/base/Profiler';
import type TelegramUser from './User';
import TelegramChat from './Chat';
import TelegramChatSender from './ChatSender';
import TelegramChatProfile from './ChatProfile';
import TelegramUserProfile from './UserProfile';
import BotP from './Bot';
import { TELEGRAM } from './constant';
import type { RawPhotoSize, RawUser, RawChat } from './types';

type PhotoResponse = {
  content: NodeJS.ReadableStream;
  contentType?: string;
  contentLength?: number;
  width: number;
  height: number;
};

type GetUserProfileOptions = {
  /**
   * The group chat to call `getChatMember` API with. By default, the
   * private chat to the user is used.
   */
  inChat?: TelegramChat;
  /**
   * Provide the `avatarUrl` of the user profile. You can use `fetchUserPhoto`
   * method to fetch the file and serve it through an open URL.
   */
  avatarUrl?: string;
  /** Force to fetch user data from API  */
  fromApi?: boolean;
};

/**
 * @category Provider
 */
export class TelegramProfiler implements UserProfiler<TelegramUser> {
  bot: BotP;
  plaform = TELEGRAM;

  constructor(bot: BotP) {
    this.bot = bot;
  }

  /**
   * Get profile of the user. If user details are not attached with the user
   * object (e.g. user retrieved from state), `getChatMember` API method is
   * called to fetch user data.
   */
  async getUserProfile(
    user: TelegramUser,
    options?: GetUserProfileOptions
  ): Promise<TelegramUserProfile>;

  async getUserProfile(
    user: TelegramChatSender,
    options?: GetUserProfileOptions
  ): Promise<TelegramChatProfile>;

  async getUserProfile(
    user: TelegramUser | TelegramChatSender,
    options: GetUserProfileOptions = {}
  ): Promise<TelegramUserProfile | TelegramChatProfile> {
    if (user.type !== 'user') {
      return this.getChatProfile(user);
    }

    const { inChat, avatarUrl, fromApi } = options;
    let userData: RawUser;

    if (user.data && !fromApi) {
      userData = user.data;
    } else {
      const chatMember = await this.bot.makeApiCall('getChatMember', {
        chat_id: inChat?.id || user.id,
        user_id: user.id,
      });
      userData = chatMember.user;
    }

    return new TelegramUserProfile(userData, avatarUrl || user.avatarUrl);
  }

  /**
   * Get profile of the chat. If chat details are not attached with the chat
   * object (e.g. chat is retrieved from state), `getChat` API method is called
   * to fetch chat data.
   */
  async getChatProfile(
    chat: string | number | TelegramChat | TelegramChatSender,
    options: {
      /**
       * Provide the `avatarUrl` of the chat profile. You can use `fetchChatPhoto`
       * method to fetch the file and serve it through an open URL.
       */
      avatarUrl?: string;
      /** Get chat data from API by force. */
      fromApi?: boolean;
    } = {}
  ): Promise<TelegramChatProfile> {
    const { fromApi, avatarUrl } = options;
    let chatId: number | string;

    if (typeof chat === 'number' || typeof chat === 'string') {
      chatId = chat;
    } else {
      const { id, data } = chat;

      if (!fromApi && data) {
        return new TelegramChatProfile(data, avatarUrl);
      }
      chatId = id;
    }

    const chatData: RawChat = await this.bot.makeApiCall('getChat', {
      chat_id: chatId,
    });

    return new TelegramChatProfile(chatData, avatarUrl);
  }

  /** Fetch the photo file of a user */
  async fetchUserPhoto(
    user: TelegramUser,
    options?: {
      /** If set, the minimum size above the value is chosen. Otherwise the smallest one */
      minWidth?: number;
    }
  ): Promise<null | PhotoResponse> {
    const { photos } = await this.bot.makeApiCall('getUserProfilePhotos', {
      user_id: user.id,
    });

    if (photos.length === 0) {
      return null;
    }

    const minWidth = options?.minWidth || 0;
    const sizes: RawPhotoSize[] = photos[0];
    const photoSize =
      sizes.find(({ width }) => width > minWidth) || sizes[sizes.length - 1];

    const fileResponse = await this.bot.fetchFile(photoSize.file_id);
    if (!fileResponse) {
      return null;
    }

    const { content, contentType, contentLength } = fileResponse;
    return {
      content,
      contentType,
      contentLength,
      width: photoSize.width,
      height: photoSize.height,
    };
  }

  /** Fetch the photo file of a chat */
  async fetchChatPhoto(
    chat: number | string | TelegramChat | TelegramChatSender,
    options?: { size?: 'big' | 'small' }
  ): Promise<null | PhotoResponse> {
    const { photo } = await this.bot.makeApiCall('getChat', {
      chat_id:
        typeof chat === 'string' || typeof chat === 'number' ? chat : chat.id,
    });

    if (!photo) {
      return null;
    }

    const fileResponse = await this.bot.fetchFile(
      options?.size === 'small' ? photo.small_file_id : photo.big_file_id
    );
    if (!fileResponse) {
      return null;
    }

    const width = options?.size === 'small' ? 160 : 640;
    const { content, contentType, contentLength } = fileResponse;
    return {
      content,
      contentType,
      contentLength,
      width,
      height: width,
    };
  }
}

const ProfilerP = makeClassProvider({
  lifetime: 'scoped',
  deps: [BotP],
})(TelegramProfiler);

type ProfilerP = TelegramProfiler;
export default ProfilerP;
