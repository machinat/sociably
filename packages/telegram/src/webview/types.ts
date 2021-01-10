import type { AuthorizerRefinement } from '@machinat/auth/types';
import type { TelegramChat } from '../channel';
import type TelegramUser from '../user';
import { TelegramChatType } from '../types';

export type TelegramAuthContext = {
  botId: number;
  channel: {
    type: TelegramChatType;
    id: number;
    title?: string;
    username?: string;
  };
  userId: number;
  firstName: string;
  lastName?: string;
  username?: string;
  photoUrl?: string;
  languageCode?: string;
};

export type TelegramAuthRefinement = AuthorizerRefinement<
  TelegramUser,
  TelegramChat
>;
