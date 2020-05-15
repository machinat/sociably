// @flow
import invariant from 'invariant';
import fetch from 'node-fetch';
import type { IncomingMessage, ServerResponse } from 'http';
import { provider } from '@machinat/core/service';
import type { ServerAuthorizer } from '@machinat/auth/types';
import { LINE_PLATFORM_CONFIGS_I } from '../interface';
import { LINE } from '../constant';
import type {
  LIFFAuthData,
  LIFFCredential,
  LinePlatformConfigs,
} from '../types';
import { refineLIFFContextData } from './utils';

type LineServerAuthorizerOpts = {
  providerId: string,
  botChannelId: string,
  liffChannelIds: string[],
};

class LineServerAuthorizer
  implements ServerAuthorizer<LIFFAuthData, LIFFCredential> {
  providerId: string;
  botChannelId: string;
  liffChannelIds: string[];

  platform = LINE;

  constructor({
    providerId,
    botChannelId,
    liffChannelIds,
  }: LineServerAuthorizerOpts = {}) {
    invariant(
      liffChannelIds && liffChannelIds.length,
      'options.liffChannelIds should not be empty'
    );
    this.providerId = providerId;
    this.botChannelId = botChannelId;
    this.liffChannelIds = liffChannelIds;
  }

  // eslint-disable-next-line class-methods-use-this
  async delegateAuthRequest(req: IncomingMessage, res: ServerResponse) {
    res.writeHead(403);
    res.end();
  }

  async verifyCredential(credential: LIFFCredential) {
    const { accessToken, data } = credential;
    // eslint-disable-next-line prefer-destructuring
    if (!accessToken) {
      return {
        success: false,
        code: 400,
        reason: 'Empty accessToken received',
      };
    }

    const { fromBotChannel } = data;
    if (fromBotChannel && fromBotChannel !== this.botChannelId) {
      return {
        success: false,
        code: 400,
        reason: 'botChannelId not match',
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

    if (!this.liffChannelIds.includes(verifyBody.client_id)) {
      return {
        success: false,
        code: 400,
        reason: 'unknown client_id of the access token',
      };
    }

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
  async refineAuth(data: LIFFAuthData) {
    const { providerId } = this;
    return refineLIFFContextData(providerId, this.botChannelId, data);
  }
}

export default provider<LineServerAuthorizer>({
  lifetime: 'transient',
  deps: [LINE_PLATFORM_CONFIGS_I],

  factory: ({
    providerId,
    botChannelId,
    liffChannelIds,
  }: LinePlatformConfigs) => {
    invariant(
      liffChannelIds,
      'provide configs.liffChannelIds to authorize with liff'
    );

    return new LineServerAuthorizer({
      providerId,
      botChannelId,
      liffChannelIds,
    });
  },
})(LineServerAuthorizer);
