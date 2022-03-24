/* eslint-disable import/prefer-default-export */
import type { ContextDetails } from '@machinat/auth';
import MessengerChat from '../Chat';
import MessengerUser from '../User';
import type { MessengerAuthContext, MessengerAuthData } from './types';

export const getAuthContextDetails = (
  data: MessengerAuthData
): ContextDetails<MessengerAuthContext> => {
  const {
    user: userId,
    page: pageId,
    chat: { type: chatType, id: chatId },
    client,
  } = data;
  return {
    user: new MessengerUser(pageId, userId),
    channel: new MessengerChat(pageId, { id: chatId }, chatType),
    pageId,
    clientType: client,
  };
};
