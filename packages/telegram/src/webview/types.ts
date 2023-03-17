import type { AuthContextBase } from '@sociably/auth';
import type TelegramChat from '../Chat';
import type TelegramUser from '../User';
import type { RawChat, RawUser } from '../types';

export type TelegramAuthData = {
  bot: number;
  chat: undefined | RawChat;
  user: Omit<RawUser, 'is_bot'>;
  photo: undefined | string;
};

export type TelegramAuthContext = {
  platform: 'telegram';
  thread: TelegramChat;
  user: TelegramUser;
  botId: number;
  photoUrl: undefined | string;
} & AuthContextBase;
