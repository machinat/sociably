import type { AuthContextBase } from '@sociably/auth';
import type TelegramChat from '../Chat.js';
import type TelegramUser from '../User.js';
import type { RawChat, RawUser } from '../types.js';

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
