/* eslint-disable camelcase */
import type { AuthContextBase } from '@sociably/auth';
import type WhatsAppChat from '../Chat';
import type WhatsAppUser from '../User';
import type { WHATSAPP } from '../constant';

export type WhatsAppAuthData = {
  business: string;
  customer: string;
};

export type WhatsAppAuthContext = {
  platform: typeof WHATSAPP;
  businessNumber: string;
  thread: WhatsAppChat;
  user: WhatsAppUser;
} & AuthContextBase;
