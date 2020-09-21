import { AuthorizerRefinement } from '@machinat/auth/types';
import { TelegramAuthData } from './types';
import TelegramUser from '../user';
import { TelegramChat, TelegramChatInstance } from '../channel';

// eslint-disable-next-line import/prefer-default-export
export const refineTelegramAuthData = ({
  channel,
  user,
  botId,
}: TelegramAuthData): AuthorizerRefinement => ({
  user: new TelegramUser(user),
  channel:
    channel === null
      ? null
      : channel.type === 'chat'
      ? new TelegramChat(botId, channel.chat)
      : new TelegramChatInstance(botId, channel.instance),
});
