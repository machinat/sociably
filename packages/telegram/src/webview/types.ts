import type { AuthContextBase } from '@sociably/auth';
import type TelegramChat from '../Chat';
import type TelegramUser from '../User';
import type { RawChat, RawUser } from '../types';

export type TelegramAuthData = {
  botId: number;
  botName: string;
  chat?: RawChat;
  user: Omit<RawUser, 'is_bot'>;
  photo?: string;
};

export type TelegramAuthContext = {
  platform: 'telegram';
  channel: TelegramUser;
  thread: TelegramChat;
  user: TelegramUser;
  botId: number;
  botName: string;
  photoUrl: undefined | string;
} & AuthContextBase;
