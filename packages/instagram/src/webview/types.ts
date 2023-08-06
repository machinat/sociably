import type { AuthContextBase } from '@sociably/auth';
import type { INSTAGRAM } from '../constant.js';
import type InstagramChat from '../Chat.js';
import type InstagramUser from '../User.js';
import type InstagramPage from '../Page.js';
import type UserProfile from '../UserProfile.js';
import type { RawUserProfile } from '../types.js';

export type InstagramAuthCredential = {
  agent: {
    page: string;
    name: string;
  };
  user: string;
};

export type InstagramAuthData = {
  agent: {
    page: string;
    name: string;
  };
  user: string;
  profile?: RawUserProfile;
};

export type InstagramAuthContext = {
  platform: typeof INSTAGRAM;
  thread: InstagramChat;
  channel: InstagramPage;
  user: null | InstagramUser;
  userProfile: null | UserProfile;
  pageId: string;
  agentUsername: string;
} & AuthContextBase;
