import { serviceProviderClass } from '@sociably/core/service';
import type { UserProfiler } from '@sociably/core/base/Profiler';
import type TwitterUser from './User.js';
import TwitterUserProfile from './UserProfile.js';
import BotP from './Bot.js';
import { TWITTER } from './constant.js';
import type { RawUser, RawSettings } from './types.js';

type GetUserProfileOptions = {
  withEntities?: boolean;
  fromApi?: boolean;
  withSettings?: boolean;
};

/** @category Provider */
export class TwitterProfiler implements UserProfiler<TwitterUser, TwitterUser> {
  bot: BotP;
  platform = TWITTER;

  constructor(bot: BotP) {
    this.bot = bot;
  }

  /** Get profile of the user. */
  async getUserProfile(
    agent: string | TwitterUser,
    user: string | TwitterUser,
    {
      withEntities = false,
      fromApi = false,
      withSettings = false,
    }: GetUserProfileOptions = {},
  ): Promise<TwitterUserProfile> {
    if (!fromApi && typeof user === 'object' && user.profile && !withSettings) {
      return user.profile;
    }

    const userId = typeof user === 'string' ? user : user.id;
    let rawUser = typeof user === 'string' ? null : user.data;

    if (fromApi || !rawUser) {
      rawUser = await this.bot.requestApi<RawUser>({
        channel: agent,
        method: 'GET',
        url: '1.1/users/show.json',
        params: { user_id: userId, include_entities: withEntities },
      });
    }

    let rawSettings: undefined | RawSettings;
    if (withSettings) {
      rawSettings = await this.bot.requestApi({
        channel: agent,
        method: 'GET',
        url: '1.1/account/settings.json',
      });
    }

    return new TwitterUserProfile(rawUser, rawSettings);
  }
}

const ProfilerP = serviceProviderClass({
  lifetime: 'scoped',
  deps: [BotP],
})(TwitterProfiler);

type ProfilerP = TwitterProfiler;
export default ProfilerP;
