// @flow
import type AuthClientController from '@machinat/auth/client';
import type { ClientLoginFn } from '../types';

const authorizeClientLogin = (
  controller: AuthClientController
): ClientLoginFn<string> => async () => {
  const { token, context } = await controller.auth();
  return { user: context.user, credential: token };
};

export default authorizeClientLogin;
