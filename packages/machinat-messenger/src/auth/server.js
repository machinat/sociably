// @flow
import invariant from 'invariant';
import crypto from 'crypto';
import type { IncomingMessage, ServerResponse } from 'http';

import { toBuffer as decodeBase64URLToBuffer } from 'base64url';
import type { AuthData, ServerAuthProvider } from 'machinat-auth/types';

import { MESSENGER } from '../constant';
import { MessengerAuthError } from '../error';
import type { ExtensionContext } from '../types';
import { refineExtensionContext, refineExtensionContextSafely } from './utils';

type MessengerServerAuthProviderOps = {
  appSecret: string,
};

class MessengerServerAuthProvider
  implements ServerAuthProvider<ExtensionContext> {
  appSecret: string;
  platform = MESSENGER;

  constructor(options: MessengerServerAuthProviderOps) {
    invariant(
      options && options.appSecret,
      'options.appSecret must not be empty'
    );

    this.appSecret = options.appSecret;
  }

  // eslint-disable-next-line class-methods-use-this
  async handleAuthRequest(req: IncomingMessage, res: ServerResponse) {
    res.writeHead(403);
    res.end();
  }

  async verifyAuthData({ data: context }: AuthData<ExtensionContext>) {
    if (!context || !context.signed_request) {
      throw new MessengerAuthError(400, 'invalid extension context');
    }

    const [sigEncoded, dataEncoded] = context.signed_request.split('.', 2);
    const sig: Buffer = decodeBase64URLToBuffer(sigEncoded);
    if (!sigEncoded || !dataEncoded) {
      throw new MessengerAuthError(400, 'invalid signed request');
    }

    const expectedSig = crypto
      .createHmac('sha256', this.appSecret)
      .update(dataEncoded)
      .digest();

    if (!sig.equals(expectedSig)) {
      throw new MessengerAuthError(401, 'invalid signature');
    }

    return refineExtensionContext(context, dataEncoded);
  }

  // eslint-disable-next-line class-methods-use-this
  async refineAuthData({ data: context }: AuthData<ExtensionContext>) {
    return refineExtensionContextSafely(context);
  }
}

export default MessengerServerAuthProvider;
