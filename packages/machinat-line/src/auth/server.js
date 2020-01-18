// @flow
import invariant from 'invariant';
import fetch from 'node-fetch';
import type { IncomingMessage, ServerResponse } from 'http';
import type { ServerAuthProvider } from 'machinat-auth/types';
import { LINE } from '../constant';
import type { LIFFAuthData, LIFFCredential } from '../types';
import { refineLIFFContextData } from './utils';

type LineServerAuthProviderOpts = {
  channelId: string,
};

class LineServerAuthProvider
  implements ServerAuthProvider<LIFFAuthData, LIFFCredential> {
  channelId: string;
  platform = LINE;

  constructor({ channelId }: LineServerAuthProviderOpts = {}) {
    invariant(channelId, 'options.channelId must not be empty');

    this.channelId = channelId;
  }

  // eslint-disable-next-line class-methods-use-this
  async delegateAuthRequest(req: IncomingMessage, res: ServerResponse) {
    res.writeHead(403);
    res.end();
  }

  async verifySigning(credential: LIFFCredential) {
    let accessToken;
    // eslint-disable-next-line prefer-destructuring
    if (!credential || !(accessToken = credential.accessToken)) {
      return {
        accepted: false,
        code: 400,
        message: 'Empty accessToken received',
      };
    }

    const verifyRes = await fetch(
      `https://api.line.me/oauth2/v2.1/verify?access_token=${accessToken}`
    );
    const verifyBody = await verifyRes.json();

    if (!verifyRes.ok) {
      return {
        accepted: false,
        code: verifyRes.status,
        message: verifyBody.error_description,
      };
    }

    if (verifyBody.client_id !== this.channelId) {
      return {
        accepted: false,
        code: 400,
        message: 'client_id not match',
      };
    }

    const profileRes = await fetch('https://api.line.me/v2/profile', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const profileBody = await profileRes.json();

    if (!profileRes.ok) {
      return {
        accepted: false,
        code: profileRes.status,
        message: profileBody.message,
      };
    }

    const { os, language, version, isInClient } = credential;
    return {
      accepted: true,
      refreshable: false,
      data: {
        os,
        language,
        version,
        isInClient,
        profile: profileBody,
      },
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
  async refineAuth(data: LIFFAuthData) {
    return refineLIFFContextData(data);
  }
}

export default LineServerAuthProvider;
