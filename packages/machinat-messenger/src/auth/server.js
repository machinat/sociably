// @flow
import invariant from 'invariant';
import crypto from 'crypto';
import type { IncomingMessage, ServerResponse } from 'http';

import {
  decode as decodeBase64URL,
  toBuffer as decodeBase64URLToBuffer,
} from 'base64url';
import type { ServerAuthProvider } from 'machinat-auth/types';

import { MESSENGER } from '../constant';
import type { ExtensionContext, ExtensionCredential } from '../types';
import { refineExtensionContext } from './utils';

type MessengerServerAuthProviderOps = {
  appSecret: string,
};

class MessengerServerAuthProvider
  implements ServerAuthProvider<ExtensionContext, ExtensionCredential> {
  appSecret: string;
  platform = MESSENGER;

  constructor(options: MessengerServerAuthProviderOps = {}) {
    invariant(options.appSecret, 'options.appSecret must not be empty');

    this.appSecret = options.appSecret;
  }

  // eslint-disable-next-line class-methods-use-this
  async delegateAuthRequest(req: IncomingMessage, res: ServerResponse) {
    res.writeHead(403);
    res.end();
  }

  async verifySigning(credential: ExtensionCredential) {
    if (!credential || !credential.signedRequest) {
      return {
        accepted: false,
        code: 400,
        message: 'invalid extension context',
      };
    }

    const [sigEncoded, dataEncoded] = credential.signedRequest.split('.', 2);
    const sig: Buffer = decodeBase64URLToBuffer(sigEncoded);
    if (!sigEncoded || !dataEncoded) {
      return {
        accepted: false,
        code: 400,
        message: 'invalid signed request',
      };
    }

    const expectedSig = crypto
      .createHmac('sha256', this.appSecret)
      .update(dataEncoded)
      .digest();

    if (!sig.equals(expectedSig)) {
      return {
        accepted: false,
        code: 401,
        message: 'invalid signature',
      };
    }

    const data = JSON.parse(decodeBase64URL(dataEncoded));

    return {
      accepted: true,
      refreshable: false,
      data,
    };
  }

  // eslint-disable-next-line class-methods-use-this
  async verifyRefreshment() {
    return {
      accepted: false,
      code: 403,
      message: 'should resign only',
    };
  }

  // eslint-disable-next-line class-methods-use-this
  async refineAuth(context: ExtensionContext) {
    return refineExtensionContext(context);
  }
}

export default MessengerServerAuthProvider;
