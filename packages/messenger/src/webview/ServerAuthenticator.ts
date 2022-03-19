import invariant from 'invariant';
import crypto from 'crypto';
import type { IncomingMessage, ServerResponse } from 'http';
import base64url from 'base64url';
import { makeClassProvider } from '@machinat/core/service';
import type {
  ServerAuthenticator,
  VerifyResult,
  CheckDataResult,
} from '@machinat/auth';
import { ConfigsI } from '../interface';
import { MESSENGER, MessengerChatType } from '../constant';
import { getAuthContextDetails } from './utils';
import type {
  MessengerAuthCredential,
  SignedReuestPayload,
  MessengerAuthContext,
  MessengerAuthData,
} from './types';

const { decode: decodeBase64Url, toBuffer: decodeBase64UrlToBuffer } =
  base64url;

type ServerAuthenticatorOptions = {
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
 * MessengerServerAuthenticator provide auth flow implementation for
 * `@machinat/auth`.
 * @category Provider
 */
export class MessengerServerAuthenticator
  implements
    ServerAuthenticator<
      MessengerAuthCredential,
      MessengerAuthData,
      MessengerAuthContext
    >
{
  platform = MESSENGER;
  pageId: number;
  appSecret: string;
  issueTimeLimit: number;

  constructor(options: ServerAuthenticatorOptions) {
    invariant(options?.appSecret, 'options.appSecret must not be empty');
    invariant(options.pageId, 'options.pageId must not be empty');

    const {
      pageId,
      appSecret,
      issueTimeLimit = 300, // 5 min;
    } = options;

    this.pageId = Number(pageId);
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
  ): Promise<VerifyResult<MessengerAuthData>> {
    if (!credential || !credential.signedRequest) {
      return {
        ok: false,
        code: 400,
        reason: 'invalid extension context',
      };
    }

    const { signedRequest, client } = credential;
    const [sigEncoded, dataEncoded] = signedRequest.split('.', 2);

    const sig: Buffer = decodeBase64UrlToBuffer(sigEncoded);
    if (!sigEncoded || !dataEncoded) {
      return {
        ok: false,
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
        ok: false,
        code: 401,
        reason: 'invalid signature',
      };
    }

    const payload: SignedReuestPayload = JSON.parse(
      decodeBase64Url(dataEncoded)
    );

    if (payload.issued_at + this.issueTimeLimit < Date.now() / 1000) {
      return {
        ok: false,
        code: 401,
        reason: 'signed request token timeout',
      };
    }

    const { psid, tid, thread_type: threadType, page_id: pageId } = payload;
    return {
      ok: true,
      data: {
        user: psid,
        chat: {
          type:
            threadType === 'USER_TO_USER'
              ? MessengerChatType.UserToUser
              : threadType === 'GROUP'
              ? MessengerChatType.Group
              : MessengerChatType.UserToPage,
          id: tid,
        },
        page: pageId,
        client,
      },
    };
  }

  async verifyRefreshment(
    data: MessengerAuthData
  ): Promise<VerifyResult<MessengerAuthData>> {
    if (data.page !== this.pageId) {
      return { ok: false, code: 400, reason: 'page not match' };
    }

    return { ok: true, data };
  }

  checkAuthData(
    data: MessengerAuthData
  ): CheckDataResult<MessengerAuthContext> {
    if (data.page !== this.pageId) {
      return { ok: false, code: 400, reason: 'page not match' };
    }

    return { ok: true, contextDetails: getAuthContextDetails(data) };
  }
}

const ServerAuthenticatorP = makeClassProvider({
  lifetime: 'transient',
  deps: [ConfigsI],
  factory: ({ pageId, appSecret }) => {
    if (!appSecret) {
      throw new Error('configs.appSecret must be set to authorize webview');
    }

    return new MessengerServerAuthenticator({ pageId, appSecret });
  },
})(MessengerServerAuthenticator);

type ServerAuthenticatorP = MessengerServerAuthenticator;

export default ServerAuthenticatorP;
