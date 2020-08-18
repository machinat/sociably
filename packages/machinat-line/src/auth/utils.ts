/* eslint-disable import/prefer-default-export  */
import LineUser from '../user';
import LineChannel from '../channel';
import { LIFFAuthData, AuthorizerRefinement } from './types';

export const refinementFromLIFFAuthData = (
  providerId: string,
  botChannelId: string,
  data: LIFFAuthData
): null | AuthorizerRefinement => {
  const { contextType, userId, utouId, groupId, roomId, fromBotChannel } = data;

  let channel: null | LineChannel;

  if (fromBotChannel) {
    if (fromBotChannel !== botChannelId || contextType !== 'utou') {
      return null;
    }

    channel = new LineChannel(providerId, botChannelId, 'utob', userId);
  } else {
    channel =
      contextType === 'utou'
        ? new LineChannel(providerId, botChannelId, 'utou', utouId as string)
        : contextType === 'room'
        ? new LineChannel(providerId, botChannelId, 'room', roomId as string)
        : contextType === 'group'
        ? new LineChannel(providerId, botChannelId, 'group', groupId as string)
        : null;
  }

  return {
    user: new LineUser(providerId, botChannelId, userId),
    channel,
  };
};
