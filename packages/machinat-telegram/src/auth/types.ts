import { RawUser, RawChat } from '../types';

export type TelegramAuthData = {
  botId: number;
  channel:
    | null
    | {
        type: 'chat';
        chat: RawChat;
      }
    | {
        type: 'chat_instance';
        instance: string;
      };
  user: RawUser;
  photoURL?: string;
};
