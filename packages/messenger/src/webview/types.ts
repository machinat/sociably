/* eslint-disable camelcase */
import type { AuthContextBase } from '@machinat/auth/types';
import type MessengerChat from '../channel';
import type MessengerUser from '../user';
import type { MessengerThreadType } from '../types';

export type MessengerAuthCredential = {
  signedRequest: string;
  client: 'messenger' | 'facebook';
};

export type ExtensionContext = {
  thread_type: MessengerThreadType;
  tid: string;
  psid: string;
  signed_request: string;
};

export type SignedReuestPayload = {
  psid: string;
  algorithm: string;
  thread_type: MessengerThreadType;
  tid: string;
  issued_at: number;
  page_id: number;
};

export type MessengerAuthData = {
  userId: string;
  chatType: MessengerThreadType;
  chatId: string;
  pageId: number;
  client: 'messenger' | 'facebook';
};

export type MessengerAuthContext = {
  platform: 'messenger';
  channel: MessengerChat;
  user: MessengerUser;
  pageId: number;
  clientType: 'messenger' | 'facebook';
} & AuthContextBase;

export type AuthorizerCredentialResult =
  | { success: true; credential: MessengerAuthCredential }
  | { success: false; code: number; reason: string };

export type AuthorizerRefinement = {
  user: MessengerUser;
  channel: MessengerChat;
};