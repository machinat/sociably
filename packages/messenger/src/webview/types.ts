/* eslint-disable camelcase */
import type MessengerChat from '../channel';
import type MessengerUser from '../user';
import type { MessengerThreadType } from '../types';

export type ExtensionCredential = {
  signedRequest: string;
};

export type ExtensionPayload = {
  psid: string;
  algorithm: string;
  thread_type: MessengerThreadType;
  tid: string;
  issued_at: number;
  page_id: number;
};

export type ExtensionContext = {
  thread_type: MessengerThreadType;
  tid: string;
  psid: string;
  signed_request: string;
};

export type AuthorizerCredentialResult =
  | { success: true; credential: ExtensionCredential }
  | { success: false; code: number; reason: string };

export type AuthorizerRefinement = {
  user: MessengerUser;
  channel: MessengerChat;
};
