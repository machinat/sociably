/* eslint-disable import/prefer-default-export */
import type { ContextDetails } from '@sociably/auth';
import FacebookChat from '../Chat';
import FacebookUser from '../User';
import type { FacebookAuthContext, FacebookAuthData } from './types';

export const getAuthContextDetails = (
  data: FacebookAuthData
): ContextDetails<FacebookAuthContext> => {
  const { page: pageId, id } = data;
  return {
    user: new FacebookUser(pageId, id),
    thread: new FacebookChat(pageId, { id }),
    pageId,
  };
};
