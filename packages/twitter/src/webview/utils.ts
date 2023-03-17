import type { ContextDetails } from '@sociably/auth';
import TwitterUser from '../User';
import TwitterChat from '../Chat';
import type { TwitterAuthContext, TwitterAuthData } from './types';

// eslint-disable-next-line import/prefer-default-export
export const getAuthContextDetails = ({
  agent,
  id,
}: TwitterAuthData): ContextDetails<TwitterAuthContext> => {
  return {
    user: new TwitterUser(id),
    thread: new TwitterChat(agent, id),
    agentId: agent,
  };
};
