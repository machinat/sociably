import type { AuthContextBase } from '@sociably/auth';
import type { FACEBOOK } from '../constant';
import type FacebookChat from '../Chat';
import type FacebookUser from '../User';
import type FacebookPage from '../Page';
import type UserProfile from '../UserProfile';
import type { RawUserProfile } from '../types';

export type FacebookAuthCredential = {
  page: string;
  user: string;
};

export type FacebookAuthData = {
  page: string;
  user: string;
  profile?: RawUserProfile;
};

export type FacebookAuthContext = {
  platform: typeof FACEBOOK;
  thread: FacebookChat;
  channel: FacebookPage;
  user: null | FacebookUser;
  userProfile: null | UserProfile;
  pageId: string;
} & AuthContextBase;
