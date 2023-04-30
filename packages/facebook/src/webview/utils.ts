/* eslint-disable import/prefer-default-export */
import type { ContextDetails } from '@sociably/auth';
import FacebookChat from '../Chat';
import FacebookUser from '../User';
import FacebookPage from '../Page';
import UserProfile from '../UserProfile';
import type { FacebookAuthContext, FacebookAuthData } from './types';

export const getAuthContextDetails = (
  data: FacebookAuthData
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
