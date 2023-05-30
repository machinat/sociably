import { serviceProviderClass } from '@sociably/core/service';
import type { UserProfiler } from '@sociably/core/base/Profiler';
import type TelegramUser from './User.js';
import TelegramChat from './Chat.js';
import TelegramChatSender from './ChatSender.js';
import TelegramChatProfile from './ChatProfile.js';
import TelegramUserProfile from './UserProfile.js';
import BotP from './Bot.js';
import { TELEGRAM } from './constant.js';
import type { RawPhotoSize, RawUser, RawChat } from './types.js';

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
export class TelegramProfiler
  implements UserProfiler<TelegramUser, TelegramUser>
{
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
    agent: number | TelegramUser,
    user: TelegramUser | TelegramChatSender,
    options: GetUserProfileOptions = {}
  ): Promise<TelegramUserProfile> {
    if (user.type !== 'user') {
      const chatProfile = await this.getChatProfile(agent, user);
      return new TelegramUserProfile(
        {
          id: chatProfile.id,
          is_bot: false,
          first_name: chatProfile.firstName || chatProfile.title || '',
          last_name: chatProfile.lastName,
          username: chatProfile.username,
        },
        chatProfile.avatarUrl
      );
    }

    const { inChat, avatarUrl, fromApi } = options;
    let userData: RawUser;

    if (user.data && !fromApi) {
      userData = user.data;
    } else {
      const chatMember = await this.bot.requestApi({
        agent,
        method: 'getChatMember',
        params: {
          chat_id: inChat?.id || user.id,
          user_id: user.id,
        },
      });
      userData = chatMember.user as RawUser;
    }

    return new TelegramUserProfile(userData, avatarUrl || user.avatarUrl);
  }

  /**
   * Get profile of the chat. If chat details are not attached with the chat
   * object (e.g. chat is retrieved from state), `getChat` API method is called
   * to fetch chat data.
   */
  async getChatProfile(
    agent: number | TelegramUser,
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

    const chatData: RawChat = await this.bot.requestApi({
      agent,
      method: 'getChat',
      params: { chat_id: chatId },
    });

    return new TelegramChatProfile(chatData, avatarUrl);
  }

  /** Fetch the photo file of a user */
  async fetchUserPhoto(
    agent: number | TelegramUser,
    user: TelegramUser,
    options?: {
      /** If set, the minimum size above the value is chosen. Otherwise the smallest one */
      minWidth?: number;
    }
  ): Promise<null | PhotoResponse> {
    const { photos } = await this.bot.requestApi<{ photos: RawPhotoSize[] }>({
      agent,
      method: 'getUserProfilePhotos',
      params: { user_id: user.id },
    });

    if (photos.length === 0) {
      return null;
    }

    const minWidth = options?.minWidth || 0;
    const sizes: RawPhotoSize[] = photos[0];
    const photoSize =
      sizes.find(({ width }) => width > minWidth) || sizes[sizes.length - 1];

    const fileResponse = await this.bot.fetchFile(agent, photoSize.file_id);
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
    agent: number | TelegramUser,
    chat: number | string | TelegramChat | TelegramChatSender,
    options?: { size?: 'big' | 'small' }
  ): Promise<null | PhotoResponse> {
    const { photo } = await this.bot.requestApi<{ photo: RawPhotoSize }>({
      agent,
      method: 'getChat',
      params: {
        chat_id:
          typeof chat === 'string' || typeof chat === 'number' ? chat : chat.id,
      },
    });

    if (!photo) {
      return null;
    }

    const fileResponse = await this.bot.fetchFile(
      agent,
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

const ProfilerP = serviceProviderClass({
  lifetime: 'scoped',
  deps: [BotP],
})(TelegramProfiler);

type ProfilerP = TelegramProfiler;
export default ProfilerP;
