/* eslint-disable import/prefer-default-export  */
import type { ContextDetails } from '@sociably/auth';
import LineUser from '../User';
import LineChat from '../Chat';
import { LiffOs, LiffReferer } from '../constant';
import type { LineAuthContext, LineAuthData } from './types';

export const getAuthContextDetails = ({
  user: userId,
  client: clientId,
  channel: channelId,
  provider: providerId,
  lang: language,
  os,
  ref,
}: LineAuthData): ContextDetails<LineAuthContext> => ({
  user: new LineUser(providerId, userId),
  channel:
    ref === LiffReferer.Utou ? new LineChat(channelId, 'user', userId) : null,
  clientId,
  providerId,
  language,
  refererType:
    ref === LiffReferer.Utou
      ? 'utou'
      : ref === LiffReferer.Group
      ? 'group'
      : ref === LiffReferer.Room
      ? 'room'
      : ref === LiffReferer.External
      ? 'external'
      : 'none',
  os: os === LiffOs.Ios ? 'ios' : os === LiffOs.Android ? 'android' : 'web',
});
