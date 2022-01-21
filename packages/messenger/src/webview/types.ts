/* eslint-disable camelcase */
import type { AuthContextBase } from '@machinat/auth';
import type MessengerChat from '../Chat';
import type MessengerUser from '../User';
import type { MessengerChatType } from '../constant';
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
  user: string;
  chat: { type: MessengerChatType; id: string };
  page: number;
  client: 'messenger' | 'facebook';
};

export type MessengerAuthContext = {
  platform: 'messenger';
  channel: MessengerChat;
  user: MessengerUser;
  pageId: number;
  clientType: 'messenger' | 'facebook';
} & AuthContextBase;

export type AuthenticatorCredentialResult =
  | { success: true; credential: MessengerAuthCredential }
  | { success: false; code: number; reason: string };

export type AuthenticatorRefinement = {
  user: MessengerUser;
  channel: MessengerChat;
};
