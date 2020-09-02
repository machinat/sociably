import type AuthClient from '@machinat/auth/client';
import type { ClientLoginFn } from '../types';

const useAuthClient = (
  controller: AuthClient
): ClientLoginFn<string> => async () => {
  const { token, context } = await controller.auth();
  return { user: context.user, credential: token };
};

export default useAuthClient;
