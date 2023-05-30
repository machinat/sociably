import { serviceProviderClass } from '@sociably/core/service';
import type { UserProfiler } from '@sociably/core/base/Profiler';
import { WHATSAPP } from './constant.js';
import type WhatsAppAgent from './Agent.js';
import type WhatsAppUser from './User.js';
import WhatsAppUserProfile from './UserProfile.js';

/**
 * @category Provider
 */
export class WhatsAppProfiler
  implements UserProfiler<WhatsAppAgent, WhatsAppUser>
{
  platform = WHATSAPP;

  // eslint-disable-next-line class-methods-use-this
  async getUserProfile(
    _agent: unknown,
    user: WhatsAppUser
  ): Promise<null | WhatsAppUserProfile> {
    return user.profile;
  }
}

const ProfilerP = serviceProviderClass({ lifetime: 'scoped' })(
  WhatsAppProfiler
);

type ProfilerP = WhatsAppProfiler;
export default ProfilerP;
