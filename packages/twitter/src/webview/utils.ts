import type { ContextSupplement } from '@machinat/auth';
import TwitterUser from '../User';
import TwitterChat from '../Chat';
import type { TwitterAuthContext, TwitterAuthData } from './types';

// eslint-disable-next-line import/prefer-default-export
export const supplementContext = ({
  agent,
  id,
}: TwitterAuthData): ContextSupplement<TwitterAuthContext> => {
  return {
    user: new TwitterUser(id),
    channel: new TwitterChat(agent, id),
    agentId: agent,
  };
};
