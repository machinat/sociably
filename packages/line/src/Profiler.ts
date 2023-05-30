import { serviceProviderClass } from '@sociably/core/service';
import type { UserProfiler } from '@sociably/core/base/Profiler';
import BotP from './Bot.js';
import type LineChnnel from './Channel.js';
import type LineChat from './Chat.js';
import type LineUser from './User.js';
import LineUserProfile from './UserProfile.js';
import { LINE } from './constant.js';
import LineGroupProfile, { LineGroupData } from './GroupProfile.js';
import type { LineRawUserProfile } from './types.js';

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
    channel: string | LineChnnel,
    user: string | LineUser,
    { inChat }: GetUserProfileOptions = {}
  ): Promise<LineUserProfile> {
    const userId = typeof user === 'string' ? user : user.id;
    const requestApi = !inChat
      ? `v2/bot/profile/${userId}`
      : inChat.type === 'group'
      ? `v2/bot/group/${inChat.id}/member/${userId}`
      : inChat.type === 'room'
      ? `v2/bot/room/${inChat.id}/member/${userId}`
      : `v2/bot/profile/${userId}`;

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
    channel: string | LineChnnel,
    chat: string | LineChat
  ): Promise<LineGroupProfile> {
    if (typeof chat !== 'string' && chat.type !== 'group') {
      throw new Error(`expect a group chat, got ${chat.type}`);
    }

    const chatId = typeof chat === 'string' ? chat : chat.id;
    const groupSummary: LineGroupData = await this.bot.requestApi({
      channel,
      method: 'GET',
      url: `v2/bot/group/${chatId}/summary`,
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
