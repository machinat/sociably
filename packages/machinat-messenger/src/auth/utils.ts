/** @internal */ /** */
/* eslint-disable import/prefer-default-export */
import MessengerChannel from '../channel';
import MessengerUser from '../user';
import type { ExtensionPayload, AuthorizerRefinement } from './types';

export const refinementFromExtensionPayload = (
  payload: ExtensionPayload
): null | AuthorizerRefinement => {
  if (!payload || !payload.page_id || !payload.psid || !payload.tid) {
    return null;
  }

  return {
    user: new MessengerUser(payload.page_id, payload.psid),
    channel: new MessengerChannel(
      payload.page_id,
      { id: payload.tid },
      payload.thread_type
    ),
  };
};
