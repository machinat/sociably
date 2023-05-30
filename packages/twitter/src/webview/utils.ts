import type { ContextDetails } from '@sociably/auth';
import TwitterChat from '../Chat.js';
import TwitterUser from '../User.js';
import UserProfile from '../UserProfile.js';
import type { TwitterAuthContext, TwitterAuthData } from './types.js';

// eslint-disable-next-line import/prefer-default-export
export const getAuthContextDetails = ({
  agent: agentId,
  user: { id: userId, data: rawUserData },
}: TwitterAuthData): ContextDetails<TwitterAuthContext> => {
  return {
    agentId,
    channel: new TwitterUser(agentId),
    user: new TwitterUser(userId, rawUserData),
    thread: new TwitterChat(agentId, userId),
    userProfile: new UserProfile(rawUserData),
  };
};
