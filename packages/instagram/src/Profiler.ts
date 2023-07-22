import { serviceProviderClass } from '@sociably/core/service';
import type { UserProfiler } from '@sociably/core/base/Profiler';
import BotP from './Bot.js';
import type InstagramPage from './Page.js';
import type InstagramUser from './User.js';
import type { RawUserProfile } from './types.js';
import { INSTAGRAM } from './constant.js';
import InstagramUserProfile from './UserProfile.js';

const DEFAULT_PROFILE_FIELDS = [
  'id',
  'name',
  'first_name',
  'last_name',
  'profile_pic',
];

/**
 * InstagramProfiler fetch user profile from Meta API.
 * @category Provider
 */
export class InstagramProfiler
  implements UserProfiler<InstagramPage, InstagramUser>
{
  private profileFieldsStr: string;
  private bot: BotP;
  platform = INSTAGRAM;

  constructor(bot: BotP) {
    this.bot = bot;
    this.profileFieldsStr = DEFAULT_PROFILE_FIELDS.join(',');
  }

  async getUserProfile(
    page: string | InstagramPage,
    user: string | InstagramUser
  ): Promise<null | InstagramUserProfile> {
    const userId = typeof user === 'string' ? user : user.id;

    const rawProfile = await this.bot.requestApi<RawUserProfile>({
      page,
      method: 'GET',
      url: `${userId}`,
      params: { fields: this.profileFieldsStr },
    });

    return new InstagramUserProfile(rawProfile);
  }
}

const ProfilerP = serviceProviderClass({
  lifetime: 'scoped',
  deps: [BotP],
})(InstagramProfiler);

type ProfilerP = InstagramProfiler;
export default ProfilerP;
