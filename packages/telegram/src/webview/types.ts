import type { AuthContextBase } from '@machinat/auth/types';
import type { TelegramChat } from '../channel';
import type TelegramUser from '../user';
import { RawChat, RawUser } from '../types';

export type TelegramAuthData = {
  bot: number;
  chat: undefined | RawChat;
  user: Omit<RawUser, 'is_bot'>;
  photo: undefined | string;
};

export type TelegramAuthContext = {
  platform: 'telegram';
  channel: TelegramChat;
  user: TelegramUser;
  botId: number;
  photoUrl: undefined | string;
} & AuthContextBase;
