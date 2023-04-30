/* eslint-disable camelcase */
import type { AuthContextBase } from '@sociably/auth';
import type WhatsAppChat from '../Chat';
import type WhatsAppUser from '../User';
import type WhatsAppAgent from '../Agent';
import type { WHATSAPP } from '../constant';

export type WhatsAppAuthData = {
  account: string;
  agent: { id: string; num: string };
  user: string;
};

export type WhatsAppAuthContext = {
  platform: typeof WHATSAPP;
  channel: WhatsAppAgent;
  thread: WhatsAppChat;
  user: WhatsAppUser;
  agentNumber: string;
  businessAccountId: string;
} & AuthContextBase;

export type WhatsAppAuthCrendential = {
  agent: string;
  user: string;
};
