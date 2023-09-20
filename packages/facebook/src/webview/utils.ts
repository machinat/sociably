/* eslint-disable import/prefer-default-export */
import type { ContextDetails } from '@sociably/auth';
import FacebookChat from '../Chat.js';
import FacebookUser from '../User.js';
import FacebookPage from '../Page.js';
import UserProfile from '../UserProfile.js';
import type { FacebookAuthContext, FacebookAuthData } from './types.js';

export const getAuthContextDetails = (
  data: FacebookAuthData,
): ContextDetails<FacebookAuthContext> => {
  const { page: pageId, user: userId, profile: profileData } = data;
  return {
    channel: new FacebookPage(pageId),
    thread: new FacebookChat(pageId, { id: userId }),
    user: new FacebookUser(pageId, userId),
    userProfile: profileData ? new UserProfile(profileData) : null,
    pageId,
  };
};
