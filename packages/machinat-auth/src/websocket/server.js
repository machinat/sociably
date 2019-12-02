// @flow
import type { ServerAuthenticatorFunc } from 'machinat-websocket/types';
import type AuthServerController from '../server';
import type { AuthContext } from '../types';

const verifyAuth = (
  controller: AuthServerController
): ServerAuthenticatorFunc<AuthContext<any>, { token: string }> => async (
  request,
  { token }
) => {
  try {
    const context = await controller.verifyHTTPAuthorization(request, token);
    const { user, expireAt } = context;

    return {
      accepted: true,
      context,
      user,
      expireAt,
    };
  } catch (err) {
    return {
      accepted: false,
      reason: err.message,
    };
  }
};

export default verifyAuth;
