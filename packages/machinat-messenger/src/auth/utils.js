// @flow
/* eslint-disable import/prefer-default-export */
import type { AuthRefineResult } from '@machinat/auth/types';
import type { ExtensionContext } from '../types';
import MessengerChannel from '../channel';
import { MessengerUser } from '../user';

export const refineExtensionContext = (
  ctx: ExtensionContext
): null | AuthRefineResult => {
  if (!ctx || !ctx.page_id || !ctx.psid || !ctx.tid) {
    return null;
  }

  return {
    user: new MessengerUser(ctx.page_id, ctx.psid),
    authorizedChannel: MessengerChannel.fromExtensionContext(ctx),
  };
};
