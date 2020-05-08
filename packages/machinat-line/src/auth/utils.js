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
  const { context, botChannelId: botChannelIdFromData } = data;
  if (!context) {
    return null;
  }

  if (botChannelIdFromData && botChannelIdFromData !== botChannelId) {
    return null;
  }

  return {
    user: new LineUser(providerId, context.userId),
    authorizedChannel: LineChannel.fromLIFFContext(
      providerId,
      botChannelId,
      context,
      !!botChannelIdFromData
    ),
  };
};
