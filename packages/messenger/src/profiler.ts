import { provider } from '@machinat/core/service';
import { BaseStateControllerI } from '@machinat/core/base';
import type {
  MachinatUserProfile,
  MachinatProfiler,
} from '@machinat/core/base/Profiler';

import { BotP } from './bot';
import type MessengerUser from './user';
import type { MessengerRawUserProfile } from './types';
import { MESSENGER } from './constant';

export class MessengerUserProfile implements MachinatUserProfile {
  data: MessengerRawUserProfile;
  platform = MESSENGER;

  constructor(rawProfile: MessengerRawUserProfile) {
    this.data = rawProfile;
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
}

/** @ignore */
const PROFILE_KEY = '$$messenger:user:profile';

/** @ignore */
const DEFAULT_PROFILE_FIELDS = [
  'id',
  'name',
  'first_name',
  'last_name',
  'profile_pic',
];

type ProfileCache = {
  data: MessengerRawUserProfile;
  fetchAt: number;
};

type ProfilerOptions = {
  profileCacheTime?: number;
  optionalProfileFields?: ('locale' | 'timezone' | 'gender')[];
};

/**
 * MessengerProfiler fetch user profile from Messenger platform.
 * @category Provider
 */
export class MessengerProfiler implements MachinatProfiler {
  bot: BotP;
  stateController: null | BaseStateControllerI;
  profileCacheTime: number;
  _fieldsParam: string;

  constructor(
    bot: BotP,
    stateController: null | BaseStateControllerI,
    { profileCacheTime, optionalProfileFields = [] }: ProfilerOptions = {}
  ) {
    this.bot = bot;
    this.stateController = stateController;
    this.profileCacheTime = profileCacheTime || 86400000;
    this._fieldsParam = [
      ...optionalProfileFields,
      ...DEFAULT_PROFILE_FIELDS,
    ].join(',');
  }

  async getUserProfile(user: MessengerUser): Promise<MessengerUserProfile> {
    if (this.stateController) {
      const cached = await this.stateController
        .userState(user)
        .get<ProfileCache>(PROFILE_KEY);

      if (cached && cached.fetchAt > Date.now() - this.profileCacheTime) {
        return new MessengerUserProfile(cached.data);
      }
    }

    const response = await this.bot.dispatchAPICall(
      'GET',
      `${user.id}?fields=${this._fieldsParam}`
    );
    const rawProfile: MessengerRawUserProfile = response.results[0].body;

    if (this.stateController) {
      await this.stateController
        .userState(user)
        .set<ProfileCache>(PROFILE_KEY, {
          data: rawProfile,
          fetchAt: Date.now(),
        });
    }

    return new MessengerUserProfile(rawProfile);
  }
}

export const ProfilerP = provider<MessengerProfiler>({
  lifetime: 'scoped',
  deps: [BotP, { require: BaseStateControllerI, optional: true }],
})(MessengerProfiler);

export type ProfilerP = MessengerProfiler;
