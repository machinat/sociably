import { AuthorizerRefinement } from '@machinat/auth/types';
import { TelegramAuthData } from './types';
import TelegramUser from '../user';
import { TelegramChat, TelegramChatInstance } from '../channel';

// eslint-disable-next-line import/prefer-default-export
export const refineTelegramAuthData = ({
  channel,
  botId,
  userId,
  firstName,
  lastName,
  username,
  languageCode,
}: TelegramAuthData): AuthorizerRefinement => ({
  user: new TelegramUser({
    id: userId,
    is_bot: false,
    first_name: firstName,
    last_name: lastName,
    username,
    language_code: languageCode,
  }),
  channel:
    channel === null
      ? null
      : channel.type === 'chat_instance'
      ? new TelegramChatInstance(botId, channel.id)
      : new TelegramChat(botId, {
          id: channel.id,
          type: channel.type,
          title: channel.title,
          username: channel.username,
        }),
});
