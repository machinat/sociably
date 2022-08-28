import { makeClassProvider } from '@sociably/core/service';
import type { UserProfiler } from '@sociably/core/base/Profiler';
import { WHATSAPP } from './constant';
import type WhatsAppUser from './User';
import WhatsAppUserProfile from './UserProfile';

/**
 * @category Provider
 */
export class WhatsAppProfiler implements UserProfiler<WhatsAppUser> {
  platform = WHATSAPP;

  // eslint-disable-next-line class-methods-use-this
  async getUserProfile(
    user: WhatsAppUser
  ): Promise<null | WhatsAppUserProfile> {
    return user.profile;
  }
}

const ProfilerP = makeClassProvider({ lifetime: 'scoped' })(WhatsAppProfiler);

type ProfilerP = WhatsAppProfiler;
export default ProfilerP;
