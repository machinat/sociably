/* eslint-disable import/prefer-default-export */
import type { ContextDetails } from '@sociably/auth';
import WhatsAppChat from '../Chat.js';
import WhatsAppUser from '../User.js';
import WhatsAppAgent from '../Agent.js';
import type { WhatsAppAuthContext, WhatsAppAuthData } from './types.js';

export const getAuthContextDetails = (
  data: WhatsAppAuthData,
): ContextDetails<WhatsAppAuthContext> => {
  const {
    agent: { id: agentNumberId, num: agentNumber },
    user: userNumberId,
  } = data;
  return {
    user: new WhatsAppUser(userNumberId),
    thread: new WhatsAppChat(agentNumberId, userNumberId),
    channel: new WhatsAppAgent(agentNumberId),
    agentNumber,
  };
};

export const trimWaUrlNumber = (number: string): string => {
  if (number.startsWith('+')) {
    return number.slice(1);
  }
  return number;
};
