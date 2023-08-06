/* eslint-disable import/prefer-default-export */
import type { ContextDetails } from '@sociably/auth';
import InstagramChat from '../Chat.js';
import InstagramUser from '../User.js';
import InstagramPage from '../Page.js';
import UserProfile from '../UserProfile.js';
import type { InstagramAuthContext, InstagramAuthData } from './types.js';

export const getAuthContextDetails = (
  data: InstagramAuthData
): ContextDetails<InstagramAuthContext> => {
  const {
    agent: { page: pageId, name: agentUsername },
    user: userId,
    profile: profileData,
  } = data;
  return {
    channel: new InstagramPage(pageId, agentUsername),
    thread: new InstagramChat(pageId, { id: userId }),
    user: new InstagramUser(pageId, userId),
    userProfile: profileData ? new UserProfile(profileData) : null,
    pageId,
    agentUsername,
  };
};
