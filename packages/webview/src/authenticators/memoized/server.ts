/* eslint-disable class-methods-use-this */
import type { IncomingMessage, ServerResponse } from 'http';
import { makeClassProvider } from '@sociably/core/service';
import type {
  ServerAuthenticator,
  VerifyResult,
  CheckDataResult,
} from '@sociably/auth';
import { MemoizedUser, MemoizedThread } from './instance';
import type { MemoizedAuthData, MemoizedAuthContext } from './types';

export class MemoizedServerAuthenticator
  implements
    ServerAuthenticator<
      MemoizedAuthData,
      MemoizedAuthData,
      MemoizedAuthContext
    >
{
  platform = 'memoized';

  async delegateAuthRequest(
    req: IncomingMessage,
    res: ServerResponse
  ): Promise<void> {
    res.writeHead(403);
    res.end();
  }

  async verifyCredential(
    data: MemoizedAuthData
  ): Promise<VerifyResult<MemoizedAuthData>> {
    return {
      ok: true as const,
      data,
    };
  }

  async verifyRefreshment(
    data: MemoizedAuthData
  ): Promise<VerifyResult<MemoizedAuthData>> {
    return {
      ok: true as const,
      data,
    };
  }

  checkAuthData({
    user: userId,
    thread: threadId,
  }: MemoizedAuthData): CheckDataResult<MemoizedAuthContext> {
    return {
      ok: true,
      contextDetails: {
        channel: null,
        user: new MemoizedUser(userId),
        thread: new MemoizedThread(threadId),
      },
    };
  }
}

const ServerAuthenticatorP = makeClassProvider({ lifetime: 'transient' })(
  MemoizedServerAuthenticator
);
type ServerAuthenticatorP = MemoizedServerAuthenticator;

export default ServerAuthenticatorP;
