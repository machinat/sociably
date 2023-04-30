import type { AuthContextBase } from '@sociably/auth';
import type TwitterChat from '../Chat';
import type TwitterUser from '../User';
import type UserProfile from '../UserProfile';
import type { RawUser } from '../types';

export type TwitterAuthCredential = {
  agent: string;
  user: string;
};

export type TwitterAuthData = {
  agent: string;
  user: { id: string; data: RawUser };
};

export type TwitterAuthContext = {
  platform: 'twitter';
  thread: TwitterChat;
  channel: TwitterUser;
  user: TwitterUser;
  userProfile: UserProfile;
  agentId: string;
} & AuthContextBase;
