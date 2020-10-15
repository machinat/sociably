import type AuthClient from '@machinat/auth/client';
import type { ClientAuthorizer } from '@machinat/auth/types';
import type { ClientLoginFn } from '../types';

const useAuthClient = <Authorizer extends ClientAuthorizer<any, any, any, any>>(
  controller: AuthClient<Authorizer>
): Authorizer extends ClientAuthorizer<infer User, any, any, any>
  ? ClientLoginFn<User, string>
  : never => {
  const loginWithAuthClient: ClientLoginFn<any, string> = async () => {
    const { token, context } = await controller.auth();
    return { user: context.user, credential: token };
  };

  return loginWithAuthClient as any;
};
export default useAuthClient;
