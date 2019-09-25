// @flow
import invariant from 'invariant';
import crypto from 'crypto';
import { decode, toBuffer as decodeBuffer } from 'base64url';
import type { ConnectionAuthenticator } from '../types';
import { MESSENGER, MESSENGER_CHAT_EXTENSION } from './constant';

type AuthenticateChatExtenstionOptions = {
  appSecret: string,
};

const authenticateChatExtenstion = (
  options: AuthenticateChatExtenstionOptions
): ConnectionAuthenticator => {
  invariant(
    options && options.appSecret,
    'appSecret must be provided to verify chat extension context'
  );

  return pass => {
    return async (body, request) => {
      if (body.type !== MESSENGER_CHAT_EXTENSION) {
        return pass(body, request);
      }

      const { signedRequest } = body;
      if (!signedRequest) {
        return {
          accepted: false,
          reason: 'signedRequest is empty',
        };
      }

      const [sigEncoded, dataEncoded] = (signedRequest: string).split('.', 2);
      const sig: Buffer = decodeBuffer(sigEncoded);
      const expectedSig = crypto
        .createHmac('sha256', options.appSecret)
        .update(dataEncoded)
        .digest();

      if (!sig.equals(expectedSig)) {
        return {
          accepted: false,
          reason: 'signature verification fail',
        };
      }

      const data = JSON.parse(decode(dataEncoded));
      return {
        accepted: true,
        user: {
          platform: MESSENGER,
          id: data.psid,
        },
        tags: [data.thread_type],
        webContext: data,
      };
    };
  };
};

export default authenticateChatExtenstion;
