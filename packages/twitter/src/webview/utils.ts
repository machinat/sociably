import type { ContextDetails } from '@machinat/auth';
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
    channel: new TwitterChat(agent, id),
    agentId: agent,
  };
};
