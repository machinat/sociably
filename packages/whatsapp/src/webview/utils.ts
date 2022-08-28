/* eslint-disable import/prefer-default-export */
import type { ContextDetails } from '@sociably/auth';
import WhatsAppChat from '../Chat';
import WhatsAppUser from '../User';
import type { WhatsAppAuthContext, WhatsAppAuthData } from './types';

export const getAuthContextDetails = (
  data: WhatsAppAuthData
): ContextDetails<WhatsAppAuthContext> => {
  const { business: businessNumber, customer: customerNumber } = data;
  return {
    user: new WhatsAppUser(customerNumber),
    channel: new WhatsAppChat(businessNumber, customerNumber),
    businessNumber,
  };
};
