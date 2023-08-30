import { serviceProviderClass } from '@sociably/core/service';
import type { UserProfiler } from '@sociably/core/base/Profiler';
import BotP from './Bot.js';
import type InstagramAgent from './Agent.js';
import type InstagramUser from './User.js';
import type { RawUserProfile } from './types.js';
import { INSTAGRAM } from './constant.js';
import InstagramUserProfile from './UserProfile.js';

const PROFILE_FIELDS = [
  'id',
  'name',
  'profile_pic',
  'username',
  'is_verified_user',
  'follower_count',
  'is_user_follow_business',
  'is_business_follow_user',
];

/**
 * InstagramProfiler fetch user profile from Meta API.
 * @category Provider
 */
export class InstagramProfiler
  implements UserProfiler<InstagramAgent, InstagramUser>
{
  private profileFieldsStr: string;
  private bot: BotP;
  platform = INSTAGRAM;

  constructor(bot: BotP) {
    this.bot = bot;
    this.profileFieldsStr = PROFILE_FIELDS.join(',');
  }

  async getUserProfile(
    agent: string | InstagramAgent,
    user: string | InstagramUser
  ): Promise<null | InstagramUserProfile> {
    const userId = typeof user === 'string' ? user : user.id;

    const rawProfile = await this.bot.requestApi<RawUserProfile>({
      channel: agent,
      method: 'GET',
      url: userId,
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
