import invariant from 'invariant';
import crypto from 'crypto';
import type { IncomingMessage, ServerResponse } from 'http';
import base64url from 'base64url';
import { makeClassProvider } from '@machinat/core/service';
import { ServerAuthorizer, AuthorizerVerifyResult } from '@machinat/auth/types';

import { PLATFORM_CONFIGS_I } from '../interface';
import { MESSENGER } from '../constant';
import type MessengerChat from '../channel';
import type MessengerUser from '../user';
import { refineExtensionPayload } from './utils';
import type {
  ExtensionPayload,
  ExtensionCredential,
  AuthorizerRefinement,
} from './types';

const {
  /** @ignore */
  decode: decodeBase64URL,
  /** @ignore */
  toBuffer: decodeBase64URLToBuffer,
} = base64url;

type MessengerServerAuthorizerOptions = {
  appSecret: string;
};

/**
 * MessengerServerAuthorizer provide auth flow implementation for
 * `@machinat/auth`.
 * @category Provider
 */
export class MessengerServerAuthorizer
  implements
    ServerAuthorizer<
      MessengerUser,
      MessengerChat,
      ExtensionPayload,
      ExtensionCredential
    > {
  appSecret: string;
  platform = MESSENGER;

  constructor(options: MessengerServerAuthorizerOptions) {
    invariant(options.appSecret, 'options.appSecret must not be empty');

    this.appSecret = options.appSecret;
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
    credential: ExtensionCredential
  ): Promise<AuthorizerVerifyResult<ExtensionPayload>> {
    if (!credential || !credential.signedRequest) {
      return {
        success: false,
        code: 400,
        reason: 'invalid extension context',
      };
    }

    const [sigEncoded, dataEncoded] = credential.signedRequest.split('.', 2);
    const sig: Buffer = decodeBase64URLToBuffer(sigEncoded);
    if (!sigEncoded || !dataEncoded) {
      return {
        success: false,
        code: 400,
        reason: 'invalid signed request',
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

    const context = JSON.parse(decodeBase64URL(dataEncoded));

    return {
      success: true,
      refreshable: false,
      context,
    };
  }

  // eslint-disable-next-line class-methods-use-this
  async verifyRefreshment(): Promise<AuthorizerVerifyResult<ExtensionPayload>> {
    return {
      success: false,
      code: 403,
      reason: 'should resign only',
    };
  }

  // eslint-disable-next-line class-methods-use-this
  async refineAuth(
    payload: ExtensionPayload
  ): Promise<null | AuthorizerRefinement> {
    return refineExtensionPayload(payload);
  }
}

export const ServerAuthorizerP = makeClassProvider({
  lifetime: 'transient',
  deps: [PLATFORM_CONFIGS_I] as const,
})(MessengerServerAuthorizer);

export type ServerAuthorizerP = MessengerServerAuthorizer;
