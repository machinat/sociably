/** @internal */ /** */
/* eslint-disable import/prefer-default-export */
import { ContextSupplement } from '@machinat/auth/types';
import MessengerChat from '../channel';
import MessengerUser from '../user';
import type { MessengerAuthContext, MessengerAuthData } from './types';

export const supplementContext = (
  data: MessengerAuthData
): null | ContextSupplement<MessengerAuthContext> => {
  if (!data || !data.pageId || !data.userId || !data.chatId) {
    return null;
  }

  const { userId, pageId, chatType, chatId, client } = data;
  return {
    user: new MessengerUser(pageId, userId),
    channel: new MessengerChat(pageId, { id: chatId }, chatType),
    pageId,
    clientType: client,
  };
};
