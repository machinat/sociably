import type {
  AuthController,
  AnyServerAuthenticator,
  ContextOfAuthenticator,
  UserOfAuthenticator,
} from '@sociably/auth';
import type { VerifyLoginFn, HttpRequestInfo } from '@sociably/websocket';

const useAuthLogin =
  <Authenticator extends AnyServerAuthenticator>(
    controller: AuthController<Authenticator>,
  ): VerifyLoginFn<
    UserOfAuthenticator<Authenticator>,
    ContextOfAuthenticator<Authenticator>,
    string
  > =>
  async (request: HttpRequestInfo, credential: string) => {
    const result = await controller.verifyAuth(request, credential);

    if (!result.ok) {
      const { code, reason } = result;
      return { ok: false as const, code, reason };
    }

    const { context } = result;
    return {
      ok: true as const,
      authContext: context,
      user: context.user as UserOfAuthenticator<Authenticator>,
      expireAt: context.expireAt,
    };
  };

export default useAuthLogin;
