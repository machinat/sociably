import { makeClassProvider } from '@machinat/core/service';
import type { UserProfiler } from '@machinat/core/base/Profiler';
import type TelegramUser from './User';
import TelegramChat from './Chat';
import TelegramChatTarget from './ChatTarget';
import TelegramChatProfile from './ChatProfile';
import TelegramUserProfile from './UserProfile';
import BotP from './Bot';
import type { RawPhotoSize, RawUser, RawChat } from './types';

type PhotoResponse = {
  content: NodeJS.ReadableStream;
  contentType?: string;
  contentLength?: number;
  width: number;
  height: number;
};

/**
 * @category Provider
 */
export class TelegramProfiler implements UserProfiler<TelegramUser> {
  bot: BotP;

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
    options: {
      /**
       * Group or channel chat for calling `getChatMember`. By default, the
       * private chat to the user is used.
       */
      inChat?: TelegramChat;
      /**
       * If provided, `avatarUrl` will be attached on the profile for storing.
       * This is useful if you want to _fetchUserPhoto_ manually.
       */
      avatarUrl?: string;
      /** Force to fetch user data from API  */
      fromApi?: boolean;
    } = {}
  ): Promise<TelegramUserProfile> {
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

    return new TelegramUserProfile(userData, avatarUrl || user.photoUrl);
  }

  /**
   * Get profile of the chat. If chat details are not attached with the chat
   * object (e.g. chat retrieved from state), `getChat` API method is called to
   * fetch chat data.
   */
  async getChatProfile(
    chat: string | number | TelegramChat | TelegramChatTarget,
    options: {
      /**
       * If provided, `avatarUrl` will be attached with the profile for storing.
       * This is useful to work with _fetchUserPhoto_ or login in the webview.
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
    } else if (chat instanceof TelegramChatTarget) {
      chatId = chat.id;
    } else {
      const { id, data } = chat;

      if (!fromApi && (data.title || data.first_name)) {
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
    chat: number | string | TelegramChat | TelegramChatTarget,
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
