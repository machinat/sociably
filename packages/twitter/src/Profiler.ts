import { makeClassProvider } from '@sociably/core/service';
import type { UserProfiler } from '@sociably/core/base/Profiler';
import type TwitterUser from './User';
import TwitterUserProfile from './UserProfile';
import BotP from './Bot';
import { TWITTER } from './constant';
import type { RawUser, RawSettings } from './types';

type GetUserProfileOptions = {
  withEntities?: boolean;
  fromApi?: boolean;
  withSettings?: boolean;
};

/**
 * @category Provider
 */
export class TwitterProfiler implements UserProfiler<TwitterUser, TwitterUser> {
  bot: BotP;
  platform = TWITTER;

  constructor(bot: BotP) {
    this.bot = bot;
  }

  /**
   * Get profile of the user.
   */
  async getUserProfile(
    agent: TwitterUser,
    user: TwitterUser,
    {
      withEntities = false,
      fromApi = false,
      withSettings = false,
    }: GetUserProfileOptions = {}
  ): Promise<TwitterUserProfile> {
    if (!fromApi && user.profile && !withSettings) {
      return user.profile;
    }

    let rawUser = user.data;
    if (fromApi || !rawUser) {
      rawUser = await this.bot.makeApiCall<RawUser>({
        agent,
        method: 'GET',
        url: '1.1/users/show.json',
        params: { user_id: user.id, include_entities: withEntities },
      });
    }

    let rawSettings: undefined | RawSettings;
    if (withSettings) {
      rawSettings = await this.bot.makeApiCall({
        agent,
        method: 'GET',
        url: '1.1/account/settings.json',
      });
    }

    return new TwitterUserProfile(rawUser, rawSettings);
  }
}

const ProfilerP = makeClassProvider({
  lifetime: 'scoped',
  deps: [BotP],
})(TwitterProfiler);

type ProfilerP = TwitterProfiler;
export default ProfilerP;
