import { MachinatUser } from '@machinat/core/types';
import type AuthClient from '@machinat/auth/client';
import type { ClientLoginFn } from '../types';

const useAuthClient = <User extends MachinatUser>(
  controller: AuthClient<User, any, any>
): ClientLoginFn<User, string> => async () => {
  const { token, context } = await controller.auth();
  return { user: context.user, credential: token };
};

export default useAuthClient;
