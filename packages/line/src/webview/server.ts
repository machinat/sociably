import invariant from 'invariant';
import fetch from 'node-fetch';
import type { IncomingMessage, ServerResponse } from 'http';
import { makeClassProvider } from '@machinat/core/service';
import type { ServerAuthorizer } from '@machinat/auth/types';

import { PLATFORM_CONFIGS_I } from '../interface';
import { LINE } from '../constant';
import type LineUser from '../user';
import type LineChat from '../channel';
import type {
  LineAuthContext,
  LineAuthCredential,
  LineVerifyAuthResult,
  AuthorizerRefinement,
} from './types';
import { refineAuthContext } from './utils';

type LineServerAuthorizerOpts = {
  providerId: string;
  channelId: string;
  liffChannelIds: string[];
};

/**
 * @category Provider
 */
export class LineServerAuthorizer
  implements
    ServerAuthorizer<LineUser, LineChat, LineAuthContext, LineAuthCredential> {
  providerId: string;
  channelId: string;
  liffChannelIds: string[];

  platform = LINE;

  constructor({
    providerId,
    channelId,
    liffChannelIds,
  }: LineServerAuthorizerOpts) {
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
    credential: LineAuthCredential
  ): Promise<LineVerifyAuthResult> {
    const { accessToken, context } = credential;
    // eslint-disable-next-line prefer-destructuring
    if (!accessToken) {
      return {
        success: false as const,
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
      context: {
        ...context,
        channelId: this.channelId,
        providerId: this.providerId,
      },
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

  // eslint-disable-next-line class-methods-use-this
  async refineAuth(ctx: LineAuthContext): Promise<null | AuthorizerRefinement> {
    const { providerId, channelId } = ctx;
    if (providerId !== this.providerId || channelId !== this.channelId) {
      return null;
    }

    return refineAuthContext(ctx);
  }
}

export const ServerAuthorizerP = makeClassProvider({
  lifetime: 'transient',
  deps: [PLATFORM_CONFIGS_I] as const,
  factory: ({ providerId, channelId, liffChannelIds }) => {
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

export type ServerAuthorizerP = LineServerAuthorizer;
