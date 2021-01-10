import TelegramUser from '../user';
import { TelegramChat } from '../channel';
import { TelegramAuthContext, TelegramAuthRefinement } from './types';

// eslint-disable-next-line import/prefer-default-export
export const refineAuthContext = ({
  channel,
  botId,
  userId,
  firstName,
  lastName,
  username,
  languageCode,
}: TelegramAuthContext): TelegramAuthRefinement => ({
  user: new TelegramUser(userId, {
    id: userId,
    is_bot: false,
    first_name: firstName,
    last_name: lastName,
    username,
    language_code: languageCode,
  }),
  channel: new TelegramChat(botId, {
    id: channel.id,
    type: channel.type,
    title: channel.title,
    username: channel.username,
  }),
});
