/* eslint-disable class-methods-use-this */
import type { IncomingMessage, ServerResponse } from 'http';
import { serviceProviderClass } from '@sociably/core/service';
import type {
  ServerAuthenticator,
  VerifyResult,
  CheckDataResult,
} from '@sociably/auth';
import MemoCacheTarget from './CacheTarget';
import type { MemoAuthData, MemoAuthContext } from './types';
import { WEBVIEW } from '../../constant';

export class MemoServerAuthenticator
  implements ServerAuthenticator<MemoAuthData, MemoAuthData, MemoAuthContext>
{
  readonly platform = WEBVIEW;

  async delegateAuthRequest(
    req: IncomingMessage,
    res: ServerResponse
  ): Promise<void> {
    res.writeHead(403);
    res.end();
  }

  async verifyCredential(
    data: MemoAuthData
  ): Promise<VerifyResult<MemoAuthData>> {
    return {
      ok: true as const,
      data,
    };
  }

  async verifyRefreshment(
    data: MemoAuthData
  ): Promise<VerifyResult<MemoAuthData>> {
    return {
      ok: true as const,
      data,
    };
  }

  checkAuthData({
    user: userId,
    thread: threadId,
  }: MemoAuthData): CheckDataResult<MemoAuthContext> {
    return {
      ok: true,
      contextDetails: {
        channel: null,
        user: new MemoCacheTarget('localStorage', userId),
        thread: new MemoCacheTarget('sessionStorage', threadId),
      },
    };
  }
}

const ServerAuthenticatorP = serviceProviderClass({ lifetime: 'transient' })(
  MemoServerAuthenticator
);
type ServerAuthenticatorP = MemoServerAuthenticator;

export default ServerAuthenticatorP;
