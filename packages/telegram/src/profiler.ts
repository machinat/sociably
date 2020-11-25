import { provider } from '@machinat/core/service';
import { BaseStateControllerI } from '@machinat/core/base';
import type {
  MachinatUserProfile,
  MachinatProfiler,
} from '@machinat/core/base/Profiler';
import TelegramUser from './user';
import type { TelegramChat, TelegramChatTarget } from './channel';
import { TELEGRAM } from './constant';
import { BotP } from './bot';
import { RawPhotoSize, RawUser } from './types';

type PhotoResponse = {
  content: NodeJS.ReadableStream;
  contentType: string;
  contentLength: number;
  width: number;
  height: number;
};

type CachedUserProfile = {
  user: RawUser;
  pictureURL: undefined | string;
};

const PROFILE_KEY = '$$telegram:user:profile';

export class TelegramUserProfile implements MachinatUserProfile {
  user: TelegramUser;
  pictureURL: undefined | string;

  platform = TELEGRAM;

  constructor(user: TelegramUser, pictureURL?: string) {
    this.user = user;
    this.pictureURL = pictureURL;
  }

  get id(): number {
    return this.user.id;
  }

  get name(): string {
    const { firstName, lastName } = this.user;
    return lastName ? `${firstName} ${lastName}` : firstName;
  }

  get firstName(): undefined | string {
    return this.user.firstName;
  }

  get lastName(): undefined | string {
    return this.user.lastName;
  }
}

/**
 * @category Provider
 */
export class TelegramProfiler implements MachinatProfiler {
  bot: BotP;
  stateController: null | BaseStateControllerI;

  constructor(bot: BotP, stateController: null | BaseStateControllerI) {
    this.bot = bot;
    this.stateController = stateController;
  }

  /** return TelegramUserProfile object with the cached pictureURL */
  async getUserProfile(
    user: TelegramUser,
    options?: { noAvatar?: boolean }
  ): Promise<TelegramUserProfile> {
    if (!this.stateController || options?.noAvatar) {
      return new TelegramUserProfile(user);
    }

    const cachedProfile = await this.stateController
      .userState(user)
      .get<CachedUserProfile>(PROFILE_KEY);

    return new TelegramUserProfile(user, cachedProfile?.pictureURL);
  }

  /** cache user data and optional pictureURL for later use */
  async cacheUserProfile(
    user: TelegramUser,
    options?: { pictureURL?: string }
  ): Promise<TelegramUserProfile> {
    if (!this.stateController) {
      throw new Error('should provide StateControllerI to cache profile');
    }

    const pictureURL = options?.pictureURL;
    const { id, isBot, firstName, lastName, username, languageCode } = user;
    const rawUser = {
      id,
      is_bot: isBot,
      first_name: firstName,
      last_name: lastName,
      username,
      language_code: languageCode,
    };

    await this.stateController
      .userState(user)
      .update<CachedUserProfile>(PROFILE_KEY, (lastCache) => ({
        user: rawUser,
        pictureURL: pictureURL || lastCache?.pictureURL,
      }));

    return new TelegramUserProfile(user, pictureURL);
  }

  /** get the cached user profile by user id */
  async getCachedUserProfile(id: number): Promise<null | TelegramUserProfile> {
    if (!this.stateController) {
      throw new Error('should provide StateControllerI to cache profile');
    }

    const phonyUser = new TelegramUser({ id, is_bot: false, first_name: '' });
    const cachedProfile = await this.stateController
      .userState(phonyUser)
      .get<CachedUserProfile>(PROFILE_KEY);

    if (!cachedProfile) {
      return null;
    }

    const { user: rawUser, pictureURL } = cachedProfile;
    return new TelegramUserProfile(new TelegramUser(rawUser), pictureURL);
  }

  /** fetch the photo file of a user */
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

export const ProfilerP = provider<TelegramProfiler>({
  lifetime: 'scoped',
  deps: [BotP, { require: BaseStateControllerI, optional: true }],
})(TelegramProfiler);

export type ProfilerP = TelegramProfiler;
