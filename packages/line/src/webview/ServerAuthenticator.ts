import invariant from 'invariant';
import { posix as posixPath } from 'path';
import type { IncomingMessage, ServerResponse } from 'http';
import { makeClassProvider } from '@sociably/core/service';
import Auth, { ServerAuthenticator, CheckDataResult } from '@sociably/auth';
import { ConfigsI } from '../interface';
import BotP from '../Bot';
import { LINE, LiffContextOs } from '../constant';
import { getAuthContextDetails } from './utils';
import LineApiError from '../error';
import type { LineRawUserProfile } from '../types';
import {
  LineAuthCredential,
  LineAuthData,
  LineAuthContext,
  LineVerifyAuthResult,
} from './types';

type LineServerAuthenticatorOpts = {
  liffId: string;
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
  httpOperator: Auth.HttpOperator;
  liffId: string;
  loginChannelId: string;
  platform = LINE;

  constructor(
    bot: BotP,
    httpOperator: Auth.HttpOperator,
    { liffId }: LineServerAuthenticatorOpts
  ) {
    invariant(liffId, 'options.liffId should not be empty');
    this.bot = bot;
    this.httpOperator = httpOperator;
    this.liffId = liffId;
    this.loginChannelId = liffId.split('-', 1)[0];
  }

  getLiffUrl(path?: string): string {
    return new URL(
      posixPath.join(this.liffId, path || ''),
      'https://liff.line.me'
    ).href;
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
        ok: false,
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
          ok: false,
          code: err.code,
          reason: err.message,
        };
      }
      throw err;
    }

    if (!this._checkClientId(verifyBody.client_id)) {
      return {
        ok: false,
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
            ok: false,
            code: err.code,
            reason: err.message,
          };
        }
        throw err;
      }
    }

    return {
      ok: true,
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
      return { ok: false, code, reason };
    }

    return { ok: true, data };
  }

  checkAuthData(data: LineAuthData): CheckDataResult<LineAuthContext> {
    const [ok, code, reason] = this._checkAuthData(data);
    if (!ok) {
      return { ok: false, code, reason };
    }

    return { ok: true, contextDetails: getAuthContextDetails(data) };
  }

  private _checkClientId(clientId: string) {
    return this.loginChannelId === clientId;
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
  deps: [BotP, Auth.HttpOperator, ConfigsI],
  factory: (bot, httpOperator, { liffId }) => {
    invariant(liffId, 'configs.liffId is required to authorize with LIFF');

    return new LineServerAuthenticator(bot, httpOperator, { liffId });
  },
})(LineServerAuthenticator);

type ServerAuthenticatorP = LineServerAuthenticator;

export default ServerAuthenticatorP;
