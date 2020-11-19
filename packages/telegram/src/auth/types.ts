import type { AuthorizerRefinement } from '@machinat/auth/types';
import type { TelegramChat } from '../channel';
import type TelegramUser from '../user';
import { TelegramChatType } from '../types';

export type TelegramAuthData = {
  botId: number;
  channel: null | {
    type: TelegramChatType;
    id: number;
    title?: string;
    username?: string;
  };
  userId: number;
  firstName: string;
  lastName?: string;
  username?: string;
  photoURL?: string;
  languageCode?: string;
};

export type TelegramAuthRefinement = AuthorizerRefinement<
  TelegramUser,
  null | TelegramChat
>;
