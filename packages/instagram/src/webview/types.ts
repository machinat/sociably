import type { AuthContextBase } from '@sociably/auth';
import type { INSTAGRAM } from '../constant.js';
import type InstagramChat from '../Chat.js';
import type InstagramUser from '../User.js';
import type InstagramAgent from '../Agent.js';
import type UserProfile from '../UserProfile.js';
import type { RawUserProfile } from '../types.js';

export type InstagramAuthCredential = {
  agent: {
    id: string;
    name: string;
  };
  user: string;
};

export type InstagramAuthData = {
  agent: {
    id: string;
    name: string;
  };
  user: string;
  profile?: RawUserProfile;
};

export type InstagramAuthContext = {
  platform: typeof INSTAGRAM;
  thread: InstagramChat;
  channel: InstagramAgent;
  user: null | InstagramUser;
  userProfile: null | UserProfile;
  agentUsername: string;
} & AuthContextBase;
