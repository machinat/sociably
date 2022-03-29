/* eslint-disable camelcase */
import type { AuthContextBase } from '@machinat/auth';
import type MessengerChat from '../Chat';
import type MessengerUser from '../User';

export type MessengerAuthData = {
  page: string;
  id: string;
};

export type MessengerAuthContext = {
  platform: 'messenger';
  channel: MessengerChat;
  user: MessengerUser;
  pageId: string;
} & AuthContextBase;

export type AuthenticatorRefinement = {
  user: MessengerUser;
  channel: MessengerChat;
};
