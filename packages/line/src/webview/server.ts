import invariant from 'invariant';
import type { IncomingMessage, ServerResponse } from 'http';
import { makeClassProvider } from '@machinat/core/service';
import type { ServerAuthorizer, ContextSupplement } from '@machinat/auth/types';

import { PLATFORM_CONFIGS_I } from '../interface';
import { BotP } from '../bot';
import { LINE } from '../constant';
import { supplementContext } from './utils';
import LineAPIError from '../error';
import type {
  LineAuthCredential,
  LineAuthData,
  LineAuthContext,
  LineVerifyAuthResult,
} from './types';

type LineServerAuthorizerOpts = {
  liffChannelIds: string[];
};

/**
 * @category Provider
 */
export class LineServerAuthorizer
  implements
    ServerAuthorizer<LineAuthCredential, LineAuthData, LineAuthContext> {
  bot: BotP;
  liffChannelIds: string[];
  platform = LINE;

  constructor(bot: BotP, { liffChannelIds }: LineServerAuthorizerOpts) {
    invariant(
      liffChannelIds && liffChannelIds.length,
      'options.liffChannelIds should not be empty'
    );
    this.bot = bot;
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
    const { accessToken, userId, groupId, roomId, os, language } = credential;

    if (!accessToken) {
      return {
        success: false,
        code: 400,
        reason: 'Empty accessToken received',
      };
    }

    let verifyBody;
    try {
      ({ body: verifyBody } = await this.bot.dispatchAPICall(
        'GET',
        `oauth2/v2.1/verify?access_token=${accessToken}`
      ));
    } catch (err) {
      if (err instanceof LineAPIError) {
        return {
          success: false,
          code: err.code,
          reason: err.message,
        };
      }
      throw err;
    }

    if (!this.liffChannelIds.includes(verifyBody.client_id)) {
      return {
        success: false,
        code: 400,
        reason: 'unknown client_id of the access token',
      };
    }

    let profileData;
    if (groupId || roomId) {
      try {
        ({ body: profileData } = await this.bot.dispatchAPICall(
          'GET',
          groupId
            ? `v2/bot/group/${groupId}/member/${userId}`
            : `v2/bot/room/${roomId}/member/${userId}`
        ));
      } catch (err) {
        if (err instanceof LineAPIError) {
          return {
            success: false,
            code: err.code,
            reason: err.message,
          };
        }
        throw err;
      }
    }

    return {
      success: true,
      data: {
        channelId: this.bot.channelId,
        providerId: this.bot.providerId,
        userId,
        groupId,
        roomId,
        os,
        language,
        name: profileData?.displayName,
        picture: profileData?.pictureUrl,
      },
    };
  }

  // eslint-disable-next-line class-methods-use-this
  async verifyRefreshment(data: LineAuthData): Promise<LineVerifyAuthResult> {
    return {
      success: true,
      data,
    };
  }

  // eslint-disable-next-line class-methods-use-this
  async supplementContext(
    data: LineAuthData
  ): Promise<null | ContextSupplement<LineAuthContext>> {
    const { providerId, channelId } = data;
    if (
      providerId !== this.bot.providerId ||
      channelId !== this.bot.channelId
    ) {
      return null;
    }

    return supplementContext(data);
  }
}

export const ServerAuthorizerP = makeClassProvider({
  lifetime: 'transient',
  deps: [BotP, PLATFORM_CONFIGS_I] as const,
  factory: (bot, { liffChannelIds }) => {
    invariant(
      liffChannelIds,
      'provide configs.liffChannelIds to authorize with liff'
    );

    return new LineServerAuthorizer(bot, {
      liffChannelIds,
    });
  },
})(LineServerAuthorizer);

export type ServerAuthorizerP = LineServerAuthorizer;
