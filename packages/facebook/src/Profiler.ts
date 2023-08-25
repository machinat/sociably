import { serviceProviderClass } from '@sociably/core/service';
import type { UserProfiler } from '@sociably/core/base/Profiler';
import { MetaApiError } from '@sociably/meta-api';
import BotP from './Bot.js';
import type FacebookPage from './Page.js';
import type FacebookUser from './User.js';
import type { RawUserProfile } from './types.js';
import { FACEBOOK } from './constant.js';
import { ConfigsI } from './interface.js';
import FacebookUserProfile from './UserProfile.js';

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
 * FacebookProfiler fetch user profile from Facebook platform.
 * @category Provider
 */
export class FacebookProfiler
  implements UserProfiler<FacebookPage, FacebookUser>
{
  private profileFieldsStr: string;
  private bot: BotP;
  platform = FACEBOOK;

  constructor(bot: BotP, { optionalProfileFields = [] }: ProfilerOptions = {}) {
    this.bot = bot;
    this.profileFieldsStr = [
      ...optionalProfileFields,
      ...DEFAULT_PROFILE_FIELDS,
    ].join(',');
  }

  async getUserProfile(
    page: string | FacebookPage,
    user: string | FacebookUser
  ): Promise<null | FacebookUserProfile> {
    const userId = typeof user === 'string' ? user : user.id;
    let rawProfile: RawUserProfile;

    try {
      rawProfile = await this.bot.requestApi({
        channel: page,
        method: 'GET',
        url: `${userId}`,
        params: { fields: this.profileFieldsStr },
      });
    } catch (err) {
      if (err instanceof MetaApiError) {
        const errSubCode = err.info.error_subcode;
        if (errSubCode === 2018218) {
          // can't get porfile from user login with phone number
          // https://developers.facebook.com/docs/messenger-platform/identity/user-profile#profile_unavailable
          return null;
        }
      }
      throw err;
    }

    return new FacebookUserProfile(rawProfile);
  }
}

const ProfilerP = serviceProviderClass({
  lifetime: 'scoped',
  deps: [BotP, ConfigsI],
})(FacebookProfiler);

type ProfilerP = FacebookProfiler;
export default ProfilerP;
