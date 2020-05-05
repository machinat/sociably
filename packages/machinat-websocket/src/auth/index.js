// @flow
import Auth from '@machinat/auth';
import type { AuthContext } from '@machinat/auth/types';
import { factory } from '@machinat/core/service';
import type { VerifySignInFn } from '../types';

const connectAuthVerifier = factory<VerifySignInFn<AuthContext<any>, string>>({
  lifetime: 'transient',
  deps: [Auth.Controller],
})((controller: Auth.Controller) => async (request, credential: string) => {
  const result = await controller.verifyAuth(request, credential);

  if (!result.success) {
    const { code, reason } = result;
    return { success: false, code, reason };
  }

  const { auth } = result;
  return {
    success: true,
    authInfo: auth,
    user: auth.user,
    expireAt: auth.expireAt,
  };
});

export default connectAuthVerifier;
