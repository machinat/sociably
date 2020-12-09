import { makeClassProvider } from '@machinat/core/service';
import type {
  MachinatProfile,
  UserProfiler,
} from '@machinat/core/base/Profiler';
import type { Marshallable } from '@machinat/core/base/Marshaler';

import { BotP } from './bot';
import type MessengerUser from './user';
import type { MessengerRawUserProfile } from './types';
import { PLATFORM_CONFIGS_I } from './interface';
import { MESSENGER } from './constant';

export class MessengerUserProfile
  implements MachinatProfile, Marshallable<MessengerRawUserProfile> {
  static fromJSONValue(data: MessengerRawUserProfile): MessengerUserProfile {
    return new MessengerUserProfile(data);
  }

  data: MessengerRawUserProfile;
  platform = MESSENGER;

  constructor(data: MessengerRawUserProfile) {
    this.data = data;
  }

  get id(): string {
    return this.data.id;
  }

  get name(): string {
    return this.data.name;
  }

  get firstName(): string {
    return this.data.first_name;
  }

  get lastName(): string {
    return this.data.last_name;
  }

  get pictureURL(): string {
    return this.data.profile_pic;
  }

  get locale(): undefined | string {
    return this.data.locale;
  }

  get timezone(): undefined | string {
    return this.data.timezone;
  }

  get gender(): undefined | string {
    return this.data.gender;
  }

  toJSONValue(): MessengerRawUserProfile {
    return this.data;
  }

  typeName(): string {
    return this.constructor.name;
  }
}

/** @ignore */
const DEFAULT_PROFILE_FIELDS = [
  'id',
  'name',
  'first_name',
  'last_name',
  'profile_pic',
];

type ProfilerOptions = {
  optionalProfileFields?: ('locale' | 'timezone' | 'gender')[];
};

/**
 * MessengerProfiler fetch user profile from Messenger platform.
 * @category Provider
 */
export class MessengerProfiler implements UserProfiler<MessengerUser> {
  bot: BotP;
  optionalUserFields: string;

  constructor(bot: BotP, { optionalProfileFields = [] }: ProfilerOptions = {}) {
    this.bot = bot;
    this.optionalUserFields = [
      ...optionalProfileFields,
      ...DEFAULT_PROFILE_FIELDS,
    ].join(',');
  }

  async getUserProfile(user: MessengerUser): Promise<MessengerUserProfile> {
    const { body: rawProfile } = await this.bot.dispatchAPICall(
      'GET',
      `${user.id}?fields=${this.optionalUserFields}`
    );

    return new MessengerUserProfile(rawProfile);
  }
}

export const ProfilerP = makeClassProvider({
  lifetime: 'scoped',
  deps: [BotP, PLATFORM_CONFIGS_I] as const,
})(MessengerProfiler);

export type ProfilerP = MessengerProfiler;
