/* eslint-disable import/prefer-default-export  */
import type { ContextSupplement } from '@machinat/auth';
import LineUser from '../User';
import LineChat from '../Chat';
import LineUserProfile from '../UserProfile';
import { LiffContextOs } from '../constant';
import type { LineAuthContext, LineAuthData } from './types';

export const supplementContext = ({
  user: userId,
  group: groupId,
  room: roomId,
  client: clientId,
  channel: channelId,
  provider: providerId,
  lang: language,
  os,
  name: displayName,
  pic: pictureUrl,
}: LineAuthData): ContextSupplement<LineAuthContext> => ({
  user: new LineUser(providerId, userId),
  channel: groupId
    ? new LineChat(channelId, 'group', groupId)
    : roomId
    ? new LineChat(channelId, 'room', roomId)
    : new LineChat(channelId, 'user', userId),
  clientId,
  channelId,
  providerId,
  language,
  os:
    os === LiffContextOs.Ios
      ? 'ios'
      : os === LiffContextOs.Android
      ? 'android'
      : 'web',
  profile: displayName
    ? new LineUserProfile({
        userId,
        displayName,
        pictureUrl,
      })
    : null,
});
