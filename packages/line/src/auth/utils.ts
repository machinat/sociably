/** @internal */ /** */
/* eslint-disable import/prefer-default-export  */
import LineUser from '../user';
import LineChat from '../channel';
import { LIFFAuthData, AuthorizerRefinement } from './types';

export const refinementFromLIFFAuthData = ({
  contextType,
  userId,
  groupId,
  roomId,
  channelId,
  providerId,
  userToBot,
}: LIFFAuthData): null | AuthorizerRefinement => ({
  user: new LineUser(providerId, userId),
  channel:
    contextType === 'group'
      ? new LineChat(channelId, 'group', groupId as string)
      : contextType === 'room'
      ? new LineChat(channelId, 'room', roomId as string)
      : userToBot
      ? new LineChat(channelId, 'user', userId)
      : null,
});
