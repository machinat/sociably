import { makeClassProvider } from '@machinat/core/service';
import type { UserProfiler } from '@machinat/core/base/Profiler';
import BotP from './Bot';
import type MessengerUser from './User';
import type { RawUserProfile } from './types';
import { ConfigsI } from './interface';
import GraphApiError from './Error';
import MessengerUserProfile from './UserProfile';

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
 * MessengerProfiler fetch user profile from Messenger platform.
 * @category Provider
 */
export class MessengerProfiler implements UserProfiler<MessengerUser> {
  bot: BotP;
  profileFields: string;

  constructor(bot: BotP, { optionalProfileFields = [] }: ProfilerOptions = {}) {
    this.bot = bot;
    this.profileFields = [
      ...optionalProfileFields,
      ...DEFAULT_PROFILE_FIELDS,
    ].join(',');
  }

  async getUserProfile(
    user: MessengerUser
  ): Promise<null | MessengerUserProfile> {
    let rawProfile: RawUserProfile;

    try {
      rawProfile = await this.bot.makeApiCall(
        'GET',
        `${user.id}?fields=${this.profileFields}`
      );
    } catch (err) {
      if (err instanceof GraphApiError) {
        const errSubCode = err.info.error_subcode;
        if (errSubCode === 2018218) {
          // can't get porfile from user login with phone number
          // https://developers.facebook.com/docs/messenger-platform/identity/user-profile#profile_unavailable
          return null;
        }
      }
      throw err;
    }

    return new MessengerUserProfile(rawProfile);
  }
}

const ProfilerP = makeClassProvider({
  lifetime: 'scoped',
  deps: [BotP, ConfigsI] as const,
})(MessengerProfiler);

type ProfilerP = MessengerProfiler;
export default ProfilerP;
