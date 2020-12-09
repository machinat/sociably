import { makeClassProvider } from '@machinat/core/service';
import type {
  MachinatProfile,
  UserProfiler,
} from '@machinat/core/base/Profiler';
import type { Marshallable } from '@machinat/core/base/Marshaler';
import TelegramUser from './user';
import { TelegramChat, TelegramChatTarget } from './channel';
import { TELEGRAM } from './constant';
import { BotP } from './bot';
import { RawPhotoSize, RawUser, RawChat, TelegramChatType } from './types';

type PhotoResponse = {
  content: NodeJS.ReadableStream;
  contentType?: string;
  contentLength?: number;
  width: number;
  height: number;
};

type TelegramUserProfileValue = {
  data: RawUser;
  pictureURL?: string;
};

export class TelegramUserProfile
  implements MachinatProfile, Marshallable<TelegramUserProfileValue> {
  static fromJSONValue(value: TelegramUserProfileValue): TelegramUserProfile {
    return new TelegramUserProfile(value.data, value.pictureURL);
  }

  pictureURL: undefined | string;
  data: RawUser;

  platform = TELEGRAM;

  constructor(rawUser: RawUser, pictureURL?: string) {
    this.pictureURL = pictureURL;
    this.data = rawUser;
  }

  get id(): number {
    return this.data.id;
  }

  get name(): string {
    const { first_name: firstName, last_name: lastName } = this.data;
    return lastName ? `${firstName} ${lastName}` : firstName;
  }

  get firstName(): undefined | string {
    return this.data.first_name;
  }

  get lastName(): undefined | string {
    return this.data.last_name;
  }

  get username(): undefined | string {
    return this.data.username;
  }

  get isBot(): boolean {
    return this.data.is_bot;
  }

  get languageCode(): undefined | string {
    return this.data.language_code;
  }

  toJSONValue(): TelegramUserProfileValue {
    const { data, pictureURL } = this;
    return { data, pictureURL };
  }

  typeName(): string {
    return this.constructor.name;
  }
}

type TelegramChatProfileValue = {
  data: RawChat;
  pictureURL?: string;
};

export class TelegramChatProfile
  implements MachinatProfile, Marshallable<TelegramChatProfileValue> {
  static fromJSONValue(value: TelegramChatProfileValue): TelegramChatProfile {
    return new TelegramChatProfile(value.data, value.pictureURL);
  }

  data: RawChat;
  pictureURL: undefined | string;
  platform = TELEGRAM;

  constructor(data: RawChat, pictureURL?: string) {
    this.data = data;
    this.pictureURL = pictureURL;
  }

  get id(): number {
    return this.data.id;
  }

  get type(): TelegramChatType {
    return this.data.type;
  }

  get name(): string {
    const { title, first_name: firstName, last_name: lastName } = this.data;
    return (title ||
      (lastName ? `${firstName} ${lastName}` : firstName)) as string;
  }

  get title(): undefined | string {
    return this.data.title;
  }

  get firstName(): undefined | string {
    return this.data.first_name;
  }

  get lastName(): undefined | string {
    return this.data.last_name;
  }

  get username(): undefined | string {
    return this.data.username;
  }

  toJSONValue(): TelegramChatProfileValue {
    const { data, pictureURL } = this;
    return { data, pictureURL };
  }

  typeName(): string {
    return this.constructor.name;
  }
}

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
       * Group or channel chat for calling `getChatMember`, by default the
       * direct private chat to the user is used.
       */
      inChat?: TelegramChat;
      /**
       * If provided, the url is attached with the profile object. This is
       * useful to work with _fetchUserPhoto_ or logging in the webview.
       */
      pictureURL?: string;
      /** Get user data from API by force. */
      fromAPI?: boolean;
    } = {}
  ): Promise<TelegramUserProfile> {
    const { inChat, pictureURL, fromAPI } = options;
    let userData: RawUser;

    if (user.data && !fromAPI) {
      userData = user.data;
    } else {
      const { result } = await this.bot.dispatchAPICall('getChatMember', {
        chat_id: inChat?.id || user.id,
        user_id: user.id,
      });
      userData = result.user;
    }

    return new TelegramUserProfile(userData, pictureURL);
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
       * If provided, the url is attached with the profile object. This is
       * useful to work with _fetchChatPhoto_.
       */
      pictureURL?: string;
      /** Get chat data from API by force. */
      fromAPI?: boolean;
    } = {}
  ): Promise<TelegramChatProfile> {
    const { fromAPI, pictureURL } = options;
    let chatId: number | string;

    if (typeof chat === 'number' || typeof chat === 'string') {
      chatId = chat;
    } else if (chat instanceof TelegramChatTarget) {
      chatId = chat.id;
    } else {
      const { id, data } = chat;

      if (!fromAPI && (data.title || data.first_name)) {
        return new TelegramChatProfile(data, pictureURL);
      }
      chatId = id;
    }

    const { result } = await this.bot.dispatchAPICall('getChat', {
      chat_id: chatId,
    });

    return new TelegramChatProfile(result, pictureURL);
  }

  /** Fetch the photo file of a user */
  async fetchUserPhoto(
    user: TelegramUser,
    options?: {
      /** If set, the minimum size above the value is chosen. Otherwise the smallest one */
      minWidth?: number;
    }
  ): Promise<null | PhotoResponse> {
    const {
      result: { photos },
    } = await this.bot.dispatchAPICall('getUserProfilePhotos', {
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
    const {
      result: { photo },
    } = await this.bot.dispatchAPICall('getChat', {
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

export const ProfilerP = makeClassProvider({
  lifetime: 'scoped',
  deps: [BotP],
})(TelegramProfiler);

export type ProfilerP = TelegramProfiler;
