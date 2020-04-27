// @flow
import invariant from 'invariant';
import crypto from 'crypto';
import type { IncomingMessage, ServerResponse } from 'http';
import {
  decode as decodeBase64URL,
  toBuffer as decodeBase64URLToBuffer,
} from 'base64url';
import { provider } from '@machinat/core/service';
import type { ServerAuthorizer } from '@machinat/auth/types';
import { MESSENGER_PLATFORM_CONFIGS_I } from '../interface';
import { MESSENGER } from '../constant';
import type {
  ExtensionContext,
  ExtensionCredential,
  MessengerPlatformConfigs,
} from '../types';
import { refineExtensionContext } from './utils';

type MessengerServerAuthorizerOps = {
  appSecret: string,
};

class MessengerServerAuthorizer
  implements ServerAuthorizer<ExtensionContext, ExtensionCredential> {
  appSecret: string;
  platform = MESSENGER;

  constructor(options: MessengerServerAuthorizerOps = {}) {
    invariant(options.appSecret, 'options.appSecret must not be empty');

    this.appSecret = options.appSecret;
  }

  // eslint-disable-next-line class-methods-use-this
  async delegateAuthRequest(req: IncomingMessage, res: ServerResponse) {
    res.writeHead(403);
    res.end();
  }

  async verifyCredential(credential: ExtensionCredential) {
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
  async verifyRefreshment() {
    return {
      success: false,
      code: 403,
      reason: 'should resign only',
    };
  }

  // eslint-disable-next-line class-methods-use-this
  async refineAuth(context: ExtensionContext) {
    return refineExtensionContext(context);
  }
}

export default provider<MessengerServerAuthorizer>({
  lifetime: 'transient',
  deps: [MESSENGER_PLATFORM_CONFIGS_I],
  factory: ({ appSecret }: MessengerPlatformConfigs) => {
    invariant(
      appSecret,
      'configs.appSecret must not be empty to use MessengerServerAuthorizer'
    );
    return new MessengerServerAuthorizer({ appSecret });
  },
})(MessengerServerAuthorizer);
