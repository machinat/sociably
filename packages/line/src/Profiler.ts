import { makeClassProvider } from '@machinat/core/service';
import type { UserProfiler } from '@machinat/core/base/Profiler';
import BotP from './Bot';
import type LineChat from './Chat';
import type LineUser from './User';
import LineUserProfile from './UserProfile';
import LineGroupProfile, { LineGroupSummary } from './GroupProfile';
import type { LineRawUserProfile } from './types';

type GetUserProfileOptions = {
  inChat?: LineChat;
};

/**
 * @category Provider
 */
export class LineProfiler implements UserProfiler<LineUser> {
  bot: BotP;

  constructor(bot: BotP) {
    this.bot = bot;
  }

  async getUserProfile(
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

    const profileData: LineRawUserProfile = await this.bot.makeApiCall(
      'GET',
      requestApi
    );

    return new LineUserProfile(profileData);
  }

  /**
   * Get profile object of a group chat. Throws if a user/room chat is received.
   */
  async getGroupProfile(chat: LineChat): Promise<LineGroupProfile> {
    if (chat.type !== 'group') {
      throw new Error(`expect a group chat, got ${chat.type}`);
    }

    const groupSummary: LineGroupSummary = await this.bot.makeApiCall(
      'GET',
      `v2/bot/group/${chat.id}/summary`
    );

    return new LineGroupProfile(groupSummary);
  }
}

const ProfilerP = makeClassProvider({
  lifetime: 'scoped',
  deps: [BotP] as const,
})(LineProfiler);

type ProfilerP = LineProfiler;

export default ProfilerP;
