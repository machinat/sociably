import Auth from '@machinat/auth';
import type { AuthContext } from '@machinat/auth/types';
import { factory } from '@machinat/core/service';
import type { VerifyLoginFn } from '../types';

/**
 * @category Provider
 */
const useAuthController = (controller: Auth.Controller) => async (
  request,
  credential: string
) => {
  const result = await controller.verifyAuth(request, credential);

  if (!result.success) {
    const { code, reason } = result;
    return { success: false as const, code, reason };
  }

  const { auth } = result;
  return {
    success: true as const,
    authInfo: auth,
    user: auth.user,
    expireAt: auth.expireAt,
  };
};

const useAuthControllerP = factory<VerifyLoginFn<AuthContext<any>, string>>({
  lifetime: 'transient',
  deps: [Auth.Controller],
})(useAuthController);

export default useAuthControllerP;
