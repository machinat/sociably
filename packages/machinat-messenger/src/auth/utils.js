// @flow
/* eslint-disable import/prefer-default-export */
import { decode as decodeBase64URL } from 'base64url';
import type { AuthResult } from 'machinat-auth/types';
import type { ExtensionContext, ExtensionContextPayload } from '../types';
import MessengerChannel from '../channel';
import { MessengerUser } from '../user';

export const refineExtensionContext = (
  ctx: ExtensionContext,
  payloadStr?: string
): AuthResult<ExtensionContext> => {
  let data = payloadStr;
  if (!data) {
    [, data] = ctx.signed_request.split('.', 2);
  }

  const payload: ExtensionContextPayload = JSON.parse(decodeBase64URL(data));

  return {
    user: new MessengerUser(payload.page_id, payload.psid),
    channel: MessengerChannel.fromExtensionContext(payload),
    loginAt: new Date(payload.issued_at * 1000),
    data: ctx,
  };
};

export const refineExtensionContextSafely = (
  ctx: ExtensionContext
): null | AuthResult<ExtensionContext> => {
  if (!ctx || !ctx.signed_request) {
    return null;
  }

  try {
    return refineExtensionContext(ctx);
  } catch (e) {
    return null;
  }
};
