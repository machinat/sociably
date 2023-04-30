import { makeClassProvider } from '@sociably/core/service';
import type { UserProfiler } from '@sociably/core/base/Profiler';
import { MetaApiError } from '@sociably/meta-api';
import BotP from './Bot';
import type FacebookPage from './Page';
import type FacebookUser from './User';
import type { RawUserProfile } from './types';
import { FACEBOOK } from './constant';
import { ConfigsI } from './interface';
import FacebookUserProfile from './UserProfile';

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
  profileFields: string;
  private _bot: BotP;
  platform = FACEBOOK;

  constructor(bot: BotP, { optionalProfileFields = [] }: ProfilerOptions = {}) {
    this._bot = bot;
    this.profileFields = [
      ...optionalProfileFields,
      ...DEFAULT_PROFILE_FIELDS,
    ].join(',');
  }

  async getUserProfile(
    page: FacebookPage,
    user: FacebookUser
  ): Promise<null | FacebookUserProfile> {
    let rawProfile: RawUserProfile;

    try {
      rawProfile = await this._bot.makeApiCall({
        page,
        method: 'GET',
        url: `${user.id}?fields=${this.profileFields}`,
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

const ProfilerP = makeClassProvider({
  lifetime: 'scoped',
  deps: [BotP, ConfigsI],
})(FacebookProfiler);

type ProfilerP = FacebookProfiler;
export default ProfilerP;
