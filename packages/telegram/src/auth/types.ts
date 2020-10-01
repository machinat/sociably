import { TelegramChatType } from '../types';

export type TelegramAuthData = {
  botId: number;
  channel:
    | null
    | {
        type: TelegramChatType;
        id: number;
        title?: string;
        username?: string;
      }
    | {
        type: 'chat_instance';
        id: string;
      };
  userId: number;
  firstName: string;
  lastName?: string;
  username?: string;
  photoURL?: string;
  languageCode?: string;
};
