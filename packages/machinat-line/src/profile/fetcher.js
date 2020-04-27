// @flow
import { provider } from '@machinat/core/service';
import { ProfileFetcherI, StateControllerI } from '@machinat/core/base';
import type LineUser from '../user';
import LineBot from '../bot';
import LineUserProfile from './profile';
import type { RawLineUserProfile } from '../types';

const PROFILE_KEY = '$$line:user:profile';

type ProfileCache = {
  data: RawLineUserProfile,
  fetchAt: number,
};

type ProfileFetcherOptions = {
  profileCacheTime?: number,
};

class LineUserProfileFetcher implements ProfileFetcherI {
  bot: LineBot;
  stateController: null | StateControllerI;
  profileCacheTime: number;

  constructor(
    bot: LineBot,
    stateController: null | StateControllerI,
    { profileCacheTime }: ProfileFetcherOptions = {}
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
      `v2/bot/profile/${user.id}`
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

export default provider<LineUserProfileFetcher>({
  lifetime: 'scoped',
  deps: [LineBot, { require: StateControllerI, optional: true }],
})(LineUserProfileFetcher);
