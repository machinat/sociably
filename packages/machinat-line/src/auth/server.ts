import invariant from 'invariant';
import fetch from 'node-fetch';
import type { IncomingMessage, ServerResponse } from 'http';
import { provider } from '@machinat/core/service';
import type { ServerAuthorizer } from '@machinat/auth/types';

import { LINE_PLATFORM_CONFIGS_I } from '../interface';
import { LINE } from '../constant';
import type { LinePlatformConfigs } from '../types';
import type {
  LIFFAuthData,
  LIFFCredential,
  LineVerifyAuthResult,
  AuthorizerRefinement,
} from './types';
import { refinementFromLIFFAuthData } from './utils';

type LineServerAuthorizerOpts = {
  providerId: string;
  channelId: string;
  liffChannelIds: string[];
};

class LineServerAuthorizer
  implements ServerAuthorizer<LIFFAuthData, LIFFCredential> {
  providerId: string;
  channelId: string;
  liffChannelIds: string[];

  platform = LINE;

  constructor(
    {
      providerId,
      channelId,
      liffChannelIds,
    }: LineServerAuthorizerOpts = {} as any
  ) {
    invariant(
      liffChannelIds && liffChannelIds.length,
      'options.liffChannelIds should not be empty'
    );
    this.providerId = providerId;
    this.channelId = channelId;
    this.liffChannelIds = liffChannelIds;
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
    credential: LIFFCredential
  ): Promise<LineVerifyAuthResult> {
    const { accessToken, data } = credential;
    // eslint-disable-next-line prefer-destructuring
    if (!accessToken) {
      return {
        success: false as const,
        code: 400,
        reason: 'Empty accessToken received',
      };
    }

    const { fromBotChannel } = data;
    if (fromBotChannel && fromBotChannel !== this.channelId) {
      return {
        success: false as const,
        code: 400,
        reason: 'channelId not match',
      };
    }

    const verifyRes = await fetch(
      `https://api.line.me/oauth2/v2.1/verify?access_token=${accessToken}`
    );
    const verifyBody = await verifyRes.json();

    if (!verifyRes.ok) {
      return {
        success: false as const,
        code: verifyRes.status,
        reason: verifyBody.error_description,
      };
    }

    if (!this.liffChannelIds.includes(verifyBody.client_id)) {
      return {
        success: false as const,
        code: 400,
        reason: 'unknown client_id of the access token',
      };
    }

    return {
      success: true as const,
      refreshable: false as const,
      data,
    };
  }

  // eslint-disable-next-line class-methods-use-this
  async verifyRefreshment(): Promise<LineVerifyAuthResult> {
    return {
      success: false as const,
      code: 403,
      reason: 'should resign only',
    };
  }

  async refineAuth(data: LIFFAuthData): Promise<null | AuthorizerRefinement> {
    const { providerId } = this;
    return refinementFromLIFFAuthData(providerId, this.channelId, data);
  }
}

export default provider<LineServerAuthorizer>({
  lifetime: 'transient',
  deps: [LINE_PLATFORM_CONFIGS_I],

  factory: ({ providerId, channelId, liffChannelIds }: LinePlatformConfigs) => {
    invariant(
      liffChannelIds,
      'provide configs.liffChannelIds to authorize with liff'
    );

    return new LineServerAuthorizer({
      providerId,
      channelId,
      liffChannelIds,
    });
  },
})(LineServerAuthorizer);
