import type { AuthContextBase } from '@machinat/auth/types';
import type { TelegramChat } from '../channel';
import type TelegramUser from '../user';
import { RawChat } from '../types';

export type TelegramAuthData = {
  botId: number;
  chat: undefined | RawChat;
  userId: number;
  firstName: string;
  lastName: undefined | string;
  username: undefined | string;
  photoUrl: undefined | string;
};

export type TelegramAuthContext = {
  platform: 'telegram';
  channel: TelegramChat;
  user: TelegramUser;
  botId: number;
  photoUrl: undefined | string;
} & AuthContextBase;
