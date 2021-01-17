import type { AuthContextBase } from '@machinat/auth/types';
import type { TelegramChat } from '../channel';
import type TelegramUser from '../user';
import { RawChat, RawUser } from '../types';

export type TelegramAuthData = {
  botId: number;
  chat: undefined | RawChat;
  user: Omit<RawUser, 'is_bot'>;
  photoUrl: undefined | string;
};

export type TelegramAuthContext = {
  platform: 'telegram';
  channel: TelegramChat;
  user: TelegramUser;
  botId: number;
  photoUrl: undefined | string;
} & AuthContextBase;
