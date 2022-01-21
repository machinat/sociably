import type { ContextSupplement } from '@machinat/auth';
import TelegramUser from '../User';
import TelegramChat from '../Chat';
import type { TelegramAuthContext, TelegramAuthData } from './types';

// eslint-disable-next-line import/prefer-default-export
export const supplementContext = ({
  chat: chatData,
  bot: botId,
  user: userData,
  photo: photoUrl,
}: TelegramAuthData): ContextSupplement<TelegramAuthContext> => {
  const user = new TelegramUser(
    userData.id,
    { ...userData, is_bot: false },
    photoUrl
  );

  return {
    user,
    channel: chatData
      ? new TelegramChat(botId, chatData)
      : TelegramChat.fromUser(botId, user),
    botId,
    photoUrl,
  };
};
