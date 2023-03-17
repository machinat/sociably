import type { AuthContextBase } from '@sociably/auth';
import type { FACEBOOK } from '../constant';
import type FacebookChat from '../Chat';
import type FacebookUser from '../User';

export type FacebookAuthData = {
  page: string;
  id: string;
};

export type FacebookAuthContext = {
  platform: typeof FACEBOOK;
  thread: FacebookChat;
  user: FacebookUser;
  pageId: string;
} & AuthContextBase;
