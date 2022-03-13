import type { AuthContextBase } from '@machinat/auth';
import type TwitterChat from '../Chat';
import type TwitterUser from '../User';

export type TwitterAuthData = {
  agent: string;
  id: string;
};

export type TwitterAuthContext = {
  platform: 'twitter';
  channel: TwitterChat;
  user: TwitterUser;
  agentId: string;
} & AuthContextBase;
