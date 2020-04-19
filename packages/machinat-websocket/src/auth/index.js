// @flow
import Auth from '@machinat/auth';
import type { AuthInfo } from '@machinat/auth/types';
import { factory } from '@machinat/core/service';
import type { VerifySignInFn } from '../types';

const connectAuthVerifier = factory<VerifySignInFn<AuthInfo<any>, string>>({
  lifetime: 'transient',
  deps: [Auth.Controller],
})((controller: Auth.Controller) => async (request, credential: string) => {
  const result = await controller.verifyHTTPAuthorization(request, credential);

  if (result.success) {
    const { auth } = result;
    return {
      success: true,
      authInfo: auth,
      user: auth.user,
      expireAt: auth.expireAt,
    };
  }

  return result;
});

export default connectAuthVerifier;
