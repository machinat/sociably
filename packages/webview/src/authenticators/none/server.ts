/* eslint-disable class-methods-use-this */
import type { IncomingMessage, ServerResponse } from 'http';
import { serviceProviderClass } from '@sociably/core/service';
import type {
  ServerAuthenticator,
  VerifyResult,
  CheckDataResult,
} from '@sociably/auth';
import type { NoneAuthData, NoneAuthContext } from './types';

export class NoneServerAuthenticator
  implements ServerAuthenticator<NoneAuthData, NoneAuthData, NoneAuthContext>
{
  platform = 'none';

  async delegateAuthRequest(
    req: IncomingMessage,
    res: ServerResponse
  ): Promise<void> {
    res.writeHead(403);
    res.end();
  }

  async verifyCredential(
    data: NoneAuthData
  ): Promise<VerifyResult<NoneAuthData>> {
    return {
      ok: true as const,
      data,
    };
  }

  async verifyRefreshment(
    data: NoneAuthData
  ): Promise<VerifyResult<NoneAuthData>> {
    return {
      ok: true as const,
      data,
    };
  }

  checkAuthData({
    user: userId,
    thread: threadId,
  }: NoneAuthData): CheckDataResult<NoneAuthContext> {
    return {
      ok: true,
      contextDetails: {
        channel: null,
        user: null,
        thread: null,
      },
    };
  }
}

const ServerAuthenticatorP = serviceProviderClass({ lifetime: 'transient' })(
  NoneServerAuthenticator
);
type ServerAuthenticatorP = NoneServerAuthenticator;

export default ServerAuthenticatorP;
