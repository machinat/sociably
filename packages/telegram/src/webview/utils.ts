import type { ContextDetails } from '@machinat/auth';
import TelegramUser from '../User';
import TelegramChat from '../Chat';
import type { RawUser } from '../types';
import type { TelegramAuthContext, TelegramAuthData } from './types';

// eslint-disable-next-line import/prefer-default-export
export const getAuthContextDetails = ({
  chat: chatData,
  bot: botId,
  user: userData,
  photo: photoUrl,
}: TelegramAuthData): ContextDetails<TelegramAuthContext> => {
  return {
    user: new TelegramUser(
      userData.id,
      { ...userData, is_bot: false },
      photoUrl
    ),
    channel: chatData
      ? new TelegramChat(botId, chatData.id, chatData)
      : TelegramChat.fromUser(botId, userData as RawUser),
    botId,
    photoUrl,
  };
};
