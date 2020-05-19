// @flow
/* eslint-disable import/prefer-default-export  */
import type { AuthorizerRefineResult } from '@machinat/auth/types';
import LineUser from '../user';
import LineChannel from '../channel';
import type { LIFFAuthData } from '../types';

export const refineLIFFContextData = (
  providerId: string,
  botChannelId: string,
  data: LIFFAuthData
): null | AuthorizerRefineResult => {
  const { contextType, userId, utouId, groupId, roomId, fromBotChannel } = data;

  let authorizedChannel;

  if (fromBotChannel) {
    if (fromBotChannel !== botChannelId || contextType !== 'utou') {
      return null;
    }

    authorizedChannel = new LineChannel(
      providerId,
      botChannelId,
      'utob',
      userId
    );
  } else {
    authorizedChannel =
      contextType === 'utou'
        ? new LineChannel(providerId, botChannelId, 'utou', (utouId: any))
        : contextType === 'room'
        ? new LineChannel(providerId, botChannelId, 'room', (roomId: any))
        : contextType === 'group'
        ? new LineChannel(providerId, botChannelId, 'group', (groupId: any))
        : null;
  }

  return {
    user: new LineUser(providerId, botChannelId, userId),
    authorizedChannel,
  };
};
