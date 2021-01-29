import { ContextSupplement } from '@machinat/auth/types';
import TelegramUser from '../user';
import { TelegramChat } from '../channel';
import { TelegramAuthContext, TelegramAuthData } from './types';

// eslint-disable-next-line import/prefer-default-export
export const supplementContext = ({
  chat: chatData,
  bot: botId,
  user: userData,
  photo: photoUrl,
}: TelegramAuthData): ContextSupplement<TelegramAuthContext> => {
  const user = new TelegramUser(userData.id, { ...userData, is_bot: false });

  return {
    user,
    channel: chatData
      ? new TelegramChat(botId, chatData)
      : TelegramChat.fromUser(botId, user),
    botId,
    photoUrl,
  };
};
