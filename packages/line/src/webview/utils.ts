/** @internal */ /** */
/* eslint-disable import/prefer-default-export  */
import LineUser from '../user';
import LineChat from '../channel';
import { LineAuthContext, AuthorizerRefinement } from './types';

export const refineAuthContext = ({
  contextType,
  userId,
  groupId,
  roomId,
  channelId,
  providerId,
}: LineAuthContext): null | AuthorizerRefinement => ({
  user: new LineUser(providerId, userId),
  channel:
    contextType === 'group'
      ? new LineChat(channelId, 'group', groupId as string)
      : contextType === 'room'
      ? new LineChat(channelId, 'room', roomId as string)
      : new LineChat(channelId, 'user', userId),
});
