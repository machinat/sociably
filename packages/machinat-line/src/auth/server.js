// @flow
import invariant from 'invariant';
import fetch from 'node-fetch';
import type { IncomingMessage, ServerResponse } from 'http';
import { provider } from '@machinat/core/service';
import type { ServerAuthorizer } from '@machinat/auth/types';
import { LINE, LINE_PLATFORM_CONFIGS_I } from '../constant';
import type {
  LIFFAuthData,
  LIFFCredential,
  LinePlatformConfigs,
} from '../types';
import { refineLIFFContextData } from './utils';

type LineServerAuthorizerOpts = {
  channelId: string,
};

class LineServerAuthorizer
  implements ServerAuthorizer<LIFFAuthData, LIFFCredential> {
  channelId: string;
  platform = LINE;

  constructor({ channelId }: LineServerAuthorizerOpts = {}) {
    invariant(channelId, 'options.channelId must not be empty');

    this.channelId = channelId;
  }

  // eslint-disable-next-line class-methods-use-this
  async delegateAuthRequest(req: IncomingMessage, res: ServerResponse) {
    res.writeHead(403);
    res.end();
  }

  async verifyCredential(credential: LIFFCredential) {
    let accessToken;
    // eslint-disable-next-line prefer-destructuring
    if (!credential || !(accessToken = credential.accessToken)) {
      return {
        success: false,
        code: 400,
        reason: 'Empty accessToken received',
      };
    }

    const verifyRes = await fetch(
      `https://api.line.me/oauth2/v2.1/verify?access_token=${accessToken}`
    );
    const verifyBody = await verifyRes.json();

    if (!verifyRes.ok) {
      return {
        success: false,
        code: verifyRes.status,
        reason: verifyBody.error_description,
      };
    }

    if (verifyBody.client_id !== this.channelId) {
      return {
        success: false,
        code: 400,
        reason: 'client_id not match',
      };
    }

    const profileRes = await fetch('https://api.line.me/v2/profile', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const profileBody = await profileRes.json();

    if (!profileRes.ok) {
      return {
        success: false,
        code: profileRes.status,
        reason: profileBody.message,
      };
    }

    const { os, language, version, isInClient } = credential;
    return {
      success: true,
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
      success: false,
      code: 403,
      reason: 'should resign only',
    };
  }

  // eslint-disable-next-line class-methods-use-this
  async refineAuth(data: LIFFAuthData) {
    return refineLIFFContextData(data);
  }
}

export default provider<LineServerAuthorizer>({
  lifetime: 'transient',
  deps: [LINE_PLATFORM_CONFIGS_I],
  factory: (configs: LinePlatformConfigs) => new LineServerAuthorizer(configs),
})(LineServerAuthorizer);
