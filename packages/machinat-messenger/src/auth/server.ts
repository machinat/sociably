import invariant from 'invariant';
import crypto from 'crypto';
import { IncomingMessage, ServerResponse } from 'http';
import base64url from 'base64url';
import { provider } from '@machinat/core/service';
import { ServerAuthorizer, AuthorizerVerifyResult } from '@machinat/auth/types';
import { PLATFORM_CONFIGS_I } from '../interface';
import { MESSENGER } from '../constant';
import { refinementFromExtensionPayload } from './utils';
import type {
  ExtensionPayload,
  ExtensionCredential,
  AuthorizerRefinement,
} from './types';

const {
  decode: decodeBase64URL,
  toBuffer: decodeBase64URLToBuffer,
} = base64url;

type MessengerServerAuthorizerOptions = {
  appSecret: string;
};

@provider<MessengerServerAuthorizer>({
  lifetime: 'transient',
  deps: [PLATFORM_CONFIGS_I],
})
class MessengerServerAuthorizer
  implements ServerAuthorizer<ExtensionPayload, ExtensionCredential> {
  appSecret: string;
  platform = MESSENGER;

  constructor(options: MessengerServerAuthorizerOptions = {} as any) {
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

    const data = JSON.parse(decodeBase64URL(dataEncoded));

    return {
      success: true,
      refreshable: false,
      data,
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
    return refinementFromExtensionPayload(payload);
  }
}

export default MessengerServerAuthorizer;
