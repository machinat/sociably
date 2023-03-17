import type { AuthContextBase } from '@sociably/auth';
import type TwitterChat from '../Chat';
import type TwitterUser from '../User';

export type TwitterAuthData = {
  agent: string;
  id: string;
};

export type TwitterAuthContext = {
  platform: 'twitter';
  thread: TwitterChat;
  user: TwitterUser;
  agentId: string;
} & AuthContextBase;
