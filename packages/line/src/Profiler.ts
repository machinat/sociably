import { serviceProviderClass } from '@sociably/core/service';
import type { UserProfiler } from '@sociably/core/base/Profiler';
import BotP from './Bot';
import type LineChnnel from './Channel';
import type LineChat from './Chat';
import type LineUser from './User';
import LineUserProfile from './UserProfile';
import { LINE } from './constant';
import LineGroupProfile, { LineGroupData } from './GroupProfile';
import type { LineRawUserProfile } from './types';

type GetUserProfileOptions = {
  inChat?: LineChat;
};

/**
 * @category Provider
 */
export class LineProfiler implements UserProfiler<LineChnnel, LineUser> {
  bot: BotP;
  platform = LINE;

  constructor(bot: BotP) {
    this.bot = bot;
  }

  async getUserProfile(
    channel: LineChnnel,
    user: LineUser,
    { inChat }: GetUserProfileOptions = {}
  ): Promise<LineUserProfile> {
    const requestApi = !inChat
      ? `v2/bot/profile/${user.id}`
      : inChat.type === 'group'
      ? `v2/bot/group/${inChat.id}/member/${user.id}`
      : inChat.type === 'room'
      ? `v2/bot/room/${inChat.id}/member/${user.id}`
      : `v2/bot/profile/${user.id}`;

    const profileData: LineRawUserProfile = await this.bot.requestApi({
      channel,
      method: 'GET',
      url: requestApi,
    });

    return new LineUserProfile(profileData);
  }

  /**
   * Get profile object of a group chat. Throws if a user/room chat is received.
   */
  async getGroupProfile(
    channel: LineChnnel,
    chat: LineChat
  ): Promise<LineGroupProfile> {
    if (chat.type !== 'group') {
      throw new Error(`expect a group chat, got ${chat.type}`);
    }

    const groupSummary: LineGroupData = await this.bot.requestApi({
      channel,
      method: 'GET',
      url: `v2/bot/group/${chat.id}/summary`,
    });

    return new LineGroupProfile(groupSummary);
  }
}

const ProfilerP = serviceProviderClass({
  lifetime: 'scoped',
  deps: [BotP],
})(LineProfiler);

type ProfilerP = LineProfiler;

export default ProfilerP;
