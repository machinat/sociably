import { provider } from '@machinat/core/service';
import { BaseStateControllerI } from '@machinat/core/base';
import type {
  MachinatUserProfile,
  MachinatProfiler,
} from '@machinat/core/base/Profiler';
import { BotP } from './bot';
import type LineUser from './user';
import type { LineRawUserProfile } from './types';
import { LINE } from './constant';

export class LineUserProfile implements MachinatUserProfile {
  data: LineRawUserProfile;
  platform = LINE;

  constructor(data: LineRawUserProfile) {
    this.data = data;
  }

  get id(): string {
    return this.data.userId;
  }

  get name(): string {
    return this.data.displayName;
  }

  get pictureURL(): undefined | string {
    return this.data.pictureUrl;
  }

  get statusMessage(): undefined | string {
    return this.data.statusMessage;
  }

  toJSON(): any {
    const { data, id, name, pictureURL } = this;
    return {
      platform: LINE,
      data,
      id,
      name,
      pictureURL,
    };
  }
}

/** @ignore */
const PROFILE_KEY = '$$line:user:profile';

type ProfileCache = {
  data: LineRawUserProfile;
  fetchAt: number;
};

type ProfilerOptions = {
  profileCacheTime?: number;
};

/**
 * @category Provider
 */
export class LineProfiler implements MachinatProfiler {
  bot: BotP;
  stateController: null | BaseStateControllerI;
  profileCacheTime: number;

  constructor(
    bot: BotP,
    stateController: null | BaseStateControllerI,
    { profileCacheTime }: ProfilerOptions = {}
  ) {
    this.bot = bot;
    this.stateController = stateController;
    this.profileCacheTime = profileCacheTime || 86400000;
  }

  async getUserProfile(user: LineUser): Promise<LineUserProfile> {
    if (this.stateController) {
      const cached = await this.stateController
        .userState(user)
        .get<ProfileCache>(PROFILE_KEY);

      if (cached && cached.fetchAt > Date.now() - this.profileCacheTime) {
        return new LineUserProfile(cached.data);
      }
    }

    const response = await this.bot.dispatchAPICall(
      'GET',
      `v2/bot/profile/${user.id}`,
      null
    );
    const rawProfile: LineRawUserProfile = response.results[0];

    if (this.stateController) {
      await this.stateController
        .userState(user)
        .set<ProfileCache>(PROFILE_KEY, {
          data: rawProfile,
          fetchAt: Date.now(),
        });
    }

    return new LineUserProfile(rawProfile);
  }
}

export const ProfilerP = provider<LineProfiler>({
  lifetime: 'scoped',
  deps: [BotP, { require: BaseStateControllerI, optional: true }],
})(LineProfiler);

export type ProfilerP = LineProfiler;
