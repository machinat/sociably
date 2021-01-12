import { ContextSupplement } from '@machinat/auth/types';
import TelegramUser from '../user';
import { TelegramChat } from '../channel';
import { TelegramAuthContext, TelegramAuthData } from './types';

// eslint-disable-next-line import/prefer-default-export
export const supplementContext = ({
  chat,
  botId,
  userId,
  firstName,
  lastName,
  username,
  photoUrl,
}: TelegramAuthData): ContextSupplement<TelegramAuthContext> => {
  const user = new TelegramUser(userId, {
    id: userId,
    is_bot: false,
    first_name: firstName,
    last_name: lastName,
    username,
  });

  return {
    user,
    channel: chat
      ? new TelegramChat(botId, chat)
      : TelegramChat.fromUser(botId, user),
    botId,
    photoUrl,
  };
};
