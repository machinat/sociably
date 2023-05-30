import type { AuthContextBase } from '@sociably/auth';
import type { FACEBOOK } from '../constant.js';
import type FacebookChat from '../Chat.js';
import type FacebookUser from '../User.js';
import type FacebookPage from '../Page.js';
import type UserProfile from '../UserProfile.js';
import type { RawUserProfile } from '../types.js';

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
