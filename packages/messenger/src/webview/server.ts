import invariant from 'invariant';
import crypto from 'crypto';
import type { IncomingMessage, ServerResponse } from 'http';
import base64url from 'base64url';
import { makeClassProvider } from '@machinat/core/service';
import {
  ServerAuthorizer,
  AuthorizerVerifyResult,
  ContextSupplement,
} from '@machinat/auth/types';

import { PLATFORM_CONFIGS_I } from '../interface';
import { MESSENGER } from '../constant';
import { supplementContext } from './utils';
import type {
  MessengerAuthCredential,
  SignedReuestPayload,
  MessengerAuthContext,
  MessengerAuthData,
} from './types';

const {
  /** @ignore */
  decode: decodeBase64Url,
  /** @ignore */
  toBuffer: decodeBase64UrlToBuffer,
} = base64url;

type MessengerServerAuthorizerOptions = {
  /** Page id which the app is running on. */
  pageId: number;
  /** App secret for verifying auth data. */
  appSecret: string;
  /**
   * Time limit in seconds for authorization, used to verify the `issued_at`
   * field from `signed_request`. Default to 5 minute.
   */
  issueTimeLimit?: number;
};

/**
 * MessengerServerAuthorizer provide auth flow implementation for
 * `@machinat/auth`.
 * @category Provider
 */
export class MessengerServerAuthorizer
  implements
    ServerAuthorizer<
      MessengerAuthCredential,
      MessengerAuthData,
      MessengerAuthContext
    > {
  platform = MESSENGER;
  pageId: number;
  appSecret: string;
  issueTimeLimit: number;

  constructor(options: MessengerServerAuthorizerOptions) {
    invariant(options?.appSecret, 'options.appSecret must not be empty');
    invariant(options.pageId, 'options.pageId must not be empty');

    const {
      pageId,
      appSecret,
      issueTimeLimit = 300, // 5 min;
    } = options;

    this.pageId = pageId;
    this.appSecret = appSecret;
    this.issueTimeLimit = issueTimeLimit;
  }

  // eslint-disable-next-line class-methods-use-this
  async delegateAuthRequest(
    req: IncomingMessage,
    res: ServerResponse
  ): Promise<void> {
    res.writeHead(403);
    res.end();
  }

  async verifyCredential(
    credential: MessengerAuthCredential
  ): Promise<AuthorizerVerifyResult<MessengerAuthData>> {
    if (!credential || !credential.signedRequest) {
      return {
        success: false,
        code: 400,
        reason: 'invalid extension context',
      };
    }

    const { signedRequest, client } = credential;
    const [sigEncoded, dataEncoded] = signedRequest.split('.', 2);

    const sig: Buffer = decodeBase64UrlToBuffer(sigEncoded);
    if (!sigEncoded || !dataEncoded) {
      return {
        success: false,
        code: 400,
        reason: 'invalid signed request token',
      };
    }

    const expectedSig = crypto
      .createHmac('sha256', this.appSecret)
      .update(dataEncoded)
      .digest();

    if (!sig.equals(expectedSig)) {
      return {
        success: false,
        code: 401,
        reason: 'invalid signature',
      };
    }

    const payload: SignedReuestPayload = JSON.parse(
      decodeBase64Url(dataEncoded)
    );

    if (payload.issued_at + this.issueTimeLimit < Date.now() / 1000) {
      return {
        success: false,
        code: 401,
        reason: 'signed request token timeout',
      };
    }

    return {
      success: true,
      data: {
        userId: payload.psid,
        chatType: payload.thread_type,
        chatId: payload.tid,
        pageId: payload.page_id,
        client,
      },
    };
  }

  // eslint-disable-next-line class-methods-use-this
  async verifyRefreshment(
    data: MessengerAuthData
  ): Promise<AuthorizerVerifyResult<MessengerAuthData>> {
    if (data.pageId !== this.pageId) {
      return {
        success: false,
        code: 404,
        reason: 'page not match',
      };
    }

    return {
      success: true,
      data,
    };
  }

  // eslint-disable-next-line class-methods-use-this
  async supplementContext(
    data: MessengerAuthData
  ): Promise<null | ContextSupplement<MessengerAuthContext>> {
    return supplementContext(data);
  }
}

export const ServerAuthorizerP = makeClassProvider({
  lifetime: 'transient',
  deps: [PLATFORM_CONFIGS_I] as const,
})(MessengerServerAuthorizer);

export type ServerAuthorizerP = MessengerServerAuthorizer;
