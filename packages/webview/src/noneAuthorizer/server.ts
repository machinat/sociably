/* eslint-disable class-methods-use-this */
import { IncomingMessage, ServerResponse } from 'http';
import { makeClassProvider } from '@machinat/core/service';
import type {
  ServerAuthorizer,
  VerifyResult,
  ContextResult,
} from '@machinat/auth/types';
import { NoneUser, NoneChannel } from './instance';
import { NoneAuthData, NoneAuthContext } from './types';

export class NoneServerAuthorizer
  implements ServerAuthorizer<NoneAuthData, NoneAuthData, NoneAuthContext> {
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
      success: true as const,
      data,
    };
  }

  async verifyRefreshment(
    data: NoneAuthData
  ): Promise<VerifyResult<NoneAuthData>> {
    return {
      success: true as const,
      data,
    };
  }

  checkAuthContext({
    user: userId,
    channel: channelId,
  }: NoneAuthData): ContextResult<NoneAuthContext> {
    return {
      success: true,
      contextSupplment: {
        user: new NoneUser(userId),
        channel: new NoneChannel(channelId),
      },
    };
  }
}

const ServerAuthorizerP = makeClassProvider({ lifetime: 'transient' })(
  NoneServerAuthorizer
);
type ServerAuthorizerP = NoneServerAuthorizer;

export default ServerAuthorizerP;
