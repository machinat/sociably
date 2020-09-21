import { provider } from '@machinat/core/service';
import { BaseUserProfilerI, BaseStateControllerI } from '@machinat/core/base';
import type { MachinatUserProfile } from '@machinat/core/base/UserProfilerI';
import type TelegramUser from './user';
import { TELEGRAM } from './constant';
import { BotP } from './bot';
import { RawPhotoSize } from './types';

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
    return `${firstName} ${lastName}`;
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
export class TelegramUserProfiler implements BaseUserProfilerI {
  bot: BotP;

  constructor(bot: BotP) {
    this.bot = bot;
  }

  // eslint-disable-next-line class-methods-use-this
  async fetchProfile(user: TelegramUser): Promise<TelegramUserProfile> {
    return new TelegramUserProfile(user);
  }

  async fetchPhotoData(
    user: TelegramUser,
    options?: {
      /** The photo with the closest width is chosen. Default to the largest one if omitted. */
      preferedWidth?: number;
    }
  ): Promise<null | {
    content: NodeJS.ReadableStream;
    contentType: string;
    contentLength: number;
    width: number;
    height: number;
  }> {
    const photosResponse = await this.bot.dispatchAPICall(
      'getUserProfilePhotos',
      { user_id: user.id }
    );

    const { photos } = photosResponse.result;
    if (photos.length === 0) {
      return null;
    }

    const sizes: RawPhotoSize[] = photos[0];
    let selectedSize: RawPhotoSize;

    if (options?.preferedWidth) {
      const { preferedWidth } = options;
      const [sizeIdx] = sizes.reduce<[number, number]>(
        ([selectedIdx, diff], { width }, curIdx) => {
          const curDiff = Math.abs(width - preferedWidth);
          return curDiff <= diff ? [curIdx, curDiff] : [selectedIdx, diff];
        },
        [-1, Infinity]
      );

      selectedSize = sizes[sizeIdx];
    } else {
      selectedSize = sizes[sizes.length - 1];
    }

    const { content, contentType, contentLength } = await this.bot.fetchFile(
      selectedSize.file_id
    );
    return {
      content,
      contentType,
      contentLength,
      width: selectedSize.width,
      height: selectedSize.height,
    };
  }
}

export const UserProfilerP = provider<TelegramUserProfiler>({
  lifetime: 'scoped',
  deps: [BotP, { require: BaseStateControllerI, optional: true }],
})(TelegramUserProfiler);

export type UserProfilerP = TelegramUserProfiler;
