import invariant from 'invariant';
import type { IncomingMessage, ServerResponse } from 'http';
import { makeClassProvider } from '@machinat/core/service';
import type { ServerAuthenticator, ContextResult } from '@machinat/auth';

import { ConfigsI } from '../interface';
import BotP from '../Bot';
import { LINE, LiffContextOs } from '../constant';
import { supplementContext } from './utils';
import LineApiError from '../error';
import type { LineRawUserProfile } from '../types';
import {
  LineAuthCredential,
  LineAuthData,
  LineAuthContext,
  LineVerifyAuthResult,
} from './types';

type LineServerAuthenticatorOpts = {
  liffChannelIds: string[];
};

type VerifyTokenResult = {
  /* eslint-disable camelcase */
  scope: string;
  client_id: string;
  expires_in: number;
  /* eslint-enable camelcase */
};

/**
 * @category Provider
 */
export class LineServerAuthenticator
  implements
    ServerAuthenticator<LineAuthCredential, LineAuthData, LineAuthContext>
{
  bot: BotP;
  liffChannelIds: string[];
  platform = LINE;

  constructor(bot: BotP, { liffChannelIds }: LineServerAuthenticatorOpts) {
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

    let verifyBody: VerifyTokenResult;
    try {
      verifyBody = await this.bot.makeApiCall(
        'GET',
        `oauth2/v2.1/verify?access_token=${accessToken}`
      );
    } catch (err) {
      if (err instanceof LineApiError) {
        return {
          success: false,
          code: err.code,
          reason: err.message,
        };
      }
      throw err;
    }

    if (!this._checkClientId(verifyBody.client_id)) {
      return {
        success: false,
        code: 400,
        reason: 'token is from unknown client',
      };
    }

    let profileData: undefined | LineRawUserProfile;

    if (groupId || roomId) {
      try {
        profileData = await this.bot.makeApiCall<LineRawUserProfile>(
          'GET',
          groupId
            ? `v2/bot/group/${groupId}/member/${userId}`
            : `v2/bot/room/${roomId}/member/${userId}`
        );
      } catch (err) {
        if (err instanceof LineApiError) {
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
        channel: this.bot.channelId,
        provider: this.bot.providerId,
        client: verifyBody.client_id,
        user: userId,
        group: groupId,
        room: roomId,
        os:
          os === 'ios'
            ? LiffContextOs.Ios
            : os === 'android'
            ? LiffContextOs.Android
            : LiffContextOs.Web,
        lang: language,
        name: profileData?.displayName,
        pic: profileData?.pictureUrl,
      },
    };
  }

  async verifyRefreshment(data: LineAuthData): Promise<LineVerifyAuthResult> {
    const [ok, code, reason] = this._checkAuthData(data);
    if (!ok) {
      return { success: false, code, reason };
    }

    return { success: true, data };
  }

  checkAuthContext(data: LineAuthData): ContextResult<LineAuthContext> {
    const [ok, code, reason] = this._checkAuthData(data);
    if (!ok) {
      return { success: false, code, reason };
    }

    return { success: true, contextSupplment: supplementContext(data) };
  }

  private _checkClientId(clientId: string) {
    return this.liffChannelIds.includes(clientId);
  }

  private _checkAuthData(data: LineAuthData): [boolean, number, string] {
    const { provider, channel, client } = data;
    if (provider !== this.bot.providerId) {
      return [false, 400, 'provider not match'];
    }
    if (channel !== this.bot.channelId) {
      return [false, 400, 'channel not match'];
    }
    if (!this._checkClientId(client)) {
      return [false, 400, 'client not match'];
    }
    return [true, 0, ''];
  }
}

const ServerAuthenticatorP = makeClassProvider({
  lifetime: 'transient',
  deps: [BotP, ConfigsI] as const,
  factory: (bot, { liffChannelIds }) => {
    invariant(
      liffChannelIds,
      'provide configs.liffChannelIds to authorize with liff'
    );

    return new LineServerAuthenticator(bot, {
      liffChannelIds,
    });
  },
})(LineServerAuthenticator);

type ServerAuthenticatorP = LineServerAuthenticator;

export default ServerAuthenticatorP;
