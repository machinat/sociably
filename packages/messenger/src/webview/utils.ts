/* eslint-disable import/prefer-default-export */
import type { ContextDetails } from '@machinat/auth';
import MessengerChat from '../Chat';
import MessengerUser from '../User';
import type { MessengerAuthContext, MessengerAuthData } from './types';

export const getAuthContextDetails = (
  data: MessengerAuthData
): ContextDetails<MessengerAuthContext> => {
  const { page: pageId, id } = data;
  return {
    user: new MessengerUser(pageId, id),
    channel: new MessengerChat(pageId, id),
    pageId,
  };
};
