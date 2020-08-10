// @flow
import { provider } from '@machinat/core/service';
import { UserProfilerI, StateControllerI } from '@machinat/core/base';
import type MessengerUser from '../user';
import MessengerBot from '../bot';
import MessengerUserProfile from './profile';
import type { MessengerRawUserProfile } from '../types';

const PROFILE_KEY = '$$messenger:user:profile';

const DEFAULT_PROFILE_FIELDS = [
  'id',
  'name',
  'first_name',
  'last_name',
  'profile_pic',
];

type ProfileCache = {
  data: MessengerRawUserProfile,
  fetchAt: number,
};

type ProfilerOptions = {
  profileCacheTime?: number,
  optionalProfileFields?: ('locale' | 'timezone' | 'gender')[],
};

class MessengerUserProfiler implements UserProfilerI {
  bot: MessengerBot;
  stateController: null | StateControllerI;
  profileCacheTime: number;
  _fieldsParam: string;

  constructor(
    bot: MessengerBot,
    stateController: null | StateControllerI,
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

  async fetchProfile(user: MessengerUser): Promise<MessengerUserProfile> {
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
        .set<ProfileCache>(PROFILE_KEY, () => ({
          data: rawProfile,
          fetchAt: Date.now(),
        }));
    }

    return new MessengerUserProfile(rawProfile);
  }
}

export default provider<MessengerUserProfiler>({
  lifetime: 'scoped',
  deps: [MessengerBot, { require: StateControllerI, optional: true }],
})(MessengerUserProfiler);
