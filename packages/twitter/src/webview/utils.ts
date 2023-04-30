import type { ContextDetails } from '@sociably/auth';
import TwitterChat from '../Chat';
import TwitterUser from '../User';
import UserProfile from '../UserProfile';
import type { TwitterAuthContext, TwitterAuthData } from './types';

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
