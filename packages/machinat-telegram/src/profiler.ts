import { provider } from '@machinat/core/service';
import { BaseUserProfilerI, BaseStateControllerI } from '@machinat/core/base';
import type { MachinatUserProfile } from '@machinat/core/base/UserProfilerI';
import type TelegramUser from './user';
import type { TelegramChat, TelegramChatTarget } from './channel';
import { TELEGRAM } from './constant';
import { BotP } from './bot';
import { RawPhotoSize } from './types';

type PhotoResponse = {
  content: NodeJS.ReadableStream;
  contentType: string;
  contentLength: number;
  width: number;
  height: number;
};

export class TelegramUserProfile implements MachinatUserProfile {
  user: TelegramUser;

  platform = TELEGRAM;
  pictureURL = undefined;

  constructor(user: TelegramUser) {
    this.user = user;
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
export class TelegramProfiler implements BaseUserProfilerI {
  bot: BotP;

  static async photoDataURI(photoResponse: PhotoResponse): Promise<string> {
    const { content, contentType } = photoResponse;

    const data: Buffer = await new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];

      content.on('data', (chunk) => {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
      });
      content.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
      content.on('error', reject);
    });

    return `data:${contentType};base64,${data.toString('base64')}`;
  }

  constructor(bot: BotP) {
    this.bot = bot;
  }

  // eslint-disable-next-line class-methods-use-this
  async fetchProfile(user: TelegramUser): Promise<TelegramUserProfile> {
    return new TelegramUserProfile(user);
  }

  async fetchUserPhoto(
    user: TelegramUser,
    options?: {
      /** If set, the minimum size above the value is chosen. Otherwise the largest one */
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

    const sizes: RawPhotoSize[] = photos[0];
    let selectedSize: RawPhotoSize;

    if (options?.minWidth) {
      const { minWidth } = options;
      const photoSize = sizes.find(({ width }) => width > minWidth);

      selectedSize = photoSize || sizes[sizes.length - 1];
    } else {
      selectedSize = sizes[sizes.length - 1];
    }

    const fileResponse = await this.bot.fetchFile(selectedSize.file_id);
    if (!fileResponse) {
      return null;
    }

    const { content, contentType, contentLength } = fileResponse;
    return {
      content,
      contentType,
      contentLength,
      width: selectedSize.width,
      height: selectedSize.height,
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

export const UserProfilerP = provider<TelegramProfiler>({
  lifetime: 'scoped',
  deps: [BotP, { require: BaseStateControllerI, optional: true }],
})(TelegramProfiler);

export type UserProfilerP = TelegramProfiler;
