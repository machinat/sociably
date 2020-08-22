import { provider } from '@machinat/core/service';
import Base from '@machinat/core/base';
import BotP, { LineBot } from '../bot';
import LineUserProfile from './profile';
import type LineUser from '../user';
import type { RawLineUserProfile } from './types';

const PROFILE_KEY = '$$line:user:profile';

type ProfileCache = {
  data: RawLineUserProfile;
  fetchAt: number;
};

type ProfilerOptions = {
  profileCacheTime?: number;
};

export class LineUserProfiler implements Base.UserProfilerI {
  bot: LineBot;
  stateController: null | Base.StateControllerI;
  profileCacheTime: number;

  constructor(
    bot: LineBot,
    stateController: null | Base.StateControllerI,
    { profileCacheTime }: ProfilerOptions = {}
  ) {
    this.bot = bot;
    this.stateController = stateController;
    this.profileCacheTime = profileCacheTime || 86400000;
  }

  async fetchProfile(user: LineUser): Promise<LineUserProfile> {
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
    const rawProfile: RawLineUserProfile = response.results[0];

    if (this.stateController) {
      await this.stateController
        .userState(user)
        .set<ProfileCache>(PROFILE_KEY, () => ({
          data: rawProfile,
          fetchAt: Date.now(),
        }));
    }

    return new LineUserProfile(rawProfile);
  }
}

export default provider<LineUserProfiler>({
  lifetime: 'scoped',
  deps: [BotP, { require: Base.StateControllerI, optional: true }],
})(LineUserProfiler);
