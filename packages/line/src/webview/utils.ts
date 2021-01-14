/** @internal */ /** */
/* eslint-disable import/prefer-default-export  */
import { ContextSupplement } from '@machinat/auth/types';
import LineUser from '../user';
import LineChat from '../channel';
import { LineUserProfile } from '../profiler';
import { LineAuthContext, LineAuthData } from './types';

export const supplementContext = ({
  userId,
  groupId,
  roomId,
  clientId,
  channelId,
  providerId,
  language,
  os,
  name,
  picture,
}: LineAuthData): null | ContextSupplement<LineAuthContext> => ({
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
  os,
  profile: name
    ? new LineUserProfile({
        userId,
        displayName: name,
        pictureUrl: picture,
      })
    : null,
});
