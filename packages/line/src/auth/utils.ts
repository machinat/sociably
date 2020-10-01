/** @internal */ /** */
/* eslint-disable import/prefer-default-export  */
import LineUser from '../user';
import LineChat from '../channel';
import { LIFFAuthData, AuthorizerRefinement } from './types';

export const refinementFromLIFFAuthData = (
  providerId: string,
  botChannelId: string,
  data: LIFFAuthData
): null | AuthorizerRefinement => {
  const { contextType, userId, utouId, groupId, roomId, botChannel } = data;

  let channel: null | LineChat;

  if (botChannel) {
    if (botChannel !== botChannelId || contextType !== 'utou') {
      return null;
    }

    channel = new LineChat(botChannelId, 'utob', userId);
  } else {
    channel =
      contextType === 'utou'
        ? new LineChat(botChannelId, 'utou', utouId as string)
        : contextType === 'room'
        ? new LineChat(botChannelId, 'room', roomId as string)
        : contextType === 'group'
        ? new LineChat(botChannelId, 'group', groupId as string)
        : null;
  }

  return {
    user: new LineUser(providerId, userId),
    channel,
  };
};
