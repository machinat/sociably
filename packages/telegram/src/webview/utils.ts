import type { ContextDetails } from '@sociably/auth';
import TelegramChat from '../Chat';
import TelegramUser from '../User';
import type { RawUser } from '../types';
import type { TelegramAuthContext, TelegramAuthData } from './types';

// eslint-disable-next-line import/prefer-default-export
export const getAuthContextDetails = ({
  chat: chatData,
  botId,
  botName,
  user: userData,
  photo: photoUrl,
}: TelegramAuthData): ContextDetails<TelegramAuthContext> => {
  return {
    channel: new TelegramUser(botId, true),
    user: new TelegramUser(
      userData.id,
      false,
      { ...userData, is_bot: false },
      photoUrl
    ),
    thread: chatData
      ? new TelegramChat(botId, chatData.id, chatData)
      : TelegramChat.fromUser(botId, userData as RawUser),
    botId,
    botName,
    photoUrl,
  };
};
