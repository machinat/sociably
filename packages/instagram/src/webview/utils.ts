/* eslint-disable import/prefer-default-export */
import type { ContextDetails } from '@sociably/auth';
import InstagramChat from '../Chat.js';
import InstagramUser from '../User.js';
import InstagramAgent from '../Agent.js';
import UserProfile from '../UserProfile.js';
import type { InstagramAuthContext, InstagramAuthData } from './types.js';

export const getAuthContextDetails = (
  data: InstagramAuthData
): ContextDetails<InstagramAuthContext> => {
  const {
    agent: { id: agentId, name: agentUsername },
    user: userId,
    profile: profileData,
  } = data;
  return {
    channel: new InstagramAgent(agentId, agentUsername),
    thread: new InstagramChat(agentId, { id: userId }),
    user: new InstagramUser(agentId, userId),
    userProfile: profileData ? new UserProfile(profileData) : null,
    agentUsername,
  };
};
