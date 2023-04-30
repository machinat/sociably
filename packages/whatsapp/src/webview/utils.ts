/* eslint-disable import/prefer-default-export */
import type { ContextDetails } from '@sociably/auth';
import WhatsAppChat from '../Chat';
import WhatsAppUser from '../User';
import WhatsAppAgent from '../Agent';
import type { WhatsAppAuthContext, WhatsAppAuthData } from './types';

export const getAuthContextDetails = (
  data: WhatsAppAuthData
): ContextDetails<WhatsAppAuthContext> => {
  const {
    account,
    agent: { id: agentNumberId, num: agentNumber },
    user: userNumberId,
  } = data;
  return {
    user: new WhatsAppUser(userNumberId),
    thread: new WhatsAppChat(agentNumberId, userNumberId),
    channel: new WhatsAppAgent(agentNumberId),
    agentNumber,
    businessAccountId: account,
  };
};

export const trimWaUrlNumber = (number: string): string => {
  if (number.startsWith('+')) {
    return number.slice(1);
  }
  return number;
};
