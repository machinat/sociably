import { parse as parseURL } from 'url';
import { createHmac } from 'crypto';
import type { IncomingMessage, ServerResponse } from 'http';
import invariant from 'invariant';
import jsonwebtoken from 'jsonwebtoken';
import thenifiedly from 'thenifiedly';
import { provider } from '@machinat/core/service';
import type {
  ServerAuthorizer,
  CookieAccessor,
  AuthorizerVerifyResult,
  AuthorizerRefinement,
} from '@machinat/auth/types';
import type { RoutingInfo } from '@machinat/http/types';

import { PLATFORM_CONFIGS_I } from '../interface';
import { TELEGRAM } from '../constant';
import { TelegramChat, TelegramChatInstance } from '../channel';
import TelegramUser from '../user';
import type { TelegramPlatformConfigs } from '../types';
import type { TelegramAuthData } from './types';
import { refineTelegramAuthData } from './utils';

type TelegramServerAuthorizerOpts = {
  botId: number;
  botToken: string;
  redirectURL: string;
};

const LOGIN_PARAMETERS = [
  'auth_date',
  'first_name',
  'id',
  'last_name',
  'photo_url',
  'username',
];

/**
 * @category Provider
 */
export class TelegramServerAuthorizer
  implements ServerAuthorizer<TelegramAuthData, void> {
  botToken: string;
  botId: number;
  redirectURL: string;

  platform = TELEGRAM;

  constructor(
    { botId, botToken, redirectURL }: TelegramServerAuthorizerOpts = {} as any
  ) {
    invariant(botToken, 'options.botToken should not be empty');
    invariant(botId, 'options.botId should not be empty');
    invariant(redirectURL, 'options.redirectURL should not be empty');

    this.botToken = botToken;
    this.botId = botId;
    this.redirectURL = redirectURL;
  }

  async signAuthCode(
    user: TelegramUser,
    chat: null | TelegramChat | TelegramChatInstance
  ): Promise<string> {
    const userData = {
      id: user.id,
      is_bot: false,
      first_name: user.firstName,
      last_name: user.lastName,
      username: user.username,
      language_code: user.languageCode,
    };

    const channelData =
      chat === null
        ? null
        : chat.type === 'chat_instance'
        ? {
            type: 'chat_instance' as const,
            instance: chat.chatInstance,
          }
        : {
            type: 'chat' as const,
            chat: {
              id: chat.id,
              type: chat.type,
              title: chat.title,
              username: chat.username,
            },
          };

    const authData: TelegramAuthData = {
      botId: this.botId,
      user: userData,
      channel: channelData,
    };

    const token = await thenifiedly.call(
      jsonwebtoken.sign,
      authData,
      this.botToken,
      { expiresIn: 20 }
    );

    return token;
  }

  private _redirect(res: ServerResponse, redirectURL: undefined | string) {
    res.writeHead(302, { Location: redirectURL || this.redirectURL });
    res.end();
  }

  private async _authorizeCodeGrant(
    req: IncomingMessage,
    res: ServerResponse,
    cookie: CookieAccessor
  ) {
    const { query } = parseURL(req.url as string, true);
    const { code, redirectURL } = query;

    if (typeof redirectURL === 'object') {
      cookie.issueError(400, 'invalid redirect url');
      this._redirect(res, undefined);
      return;
    }

    if (typeof code !== 'string') {
      cookie.issueError(400, 'invalid code received');
      this._redirect(res, redirectURL);
      return;
    }

    try {
      const authData: TelegramAuthData = await thenifiedly.call(
        jsonwebtoken.verify,
        code,
        this.botToken
      );
      cookie.issueAuth(authData);
    } catch (err) {
      cookie.issueError(401, err.message);
    }

    this._redirect(res, redirectURL);
  }

  private _authorizeLogin(
    req: IncomingMessage,
    res: ServerResponse,
    cookie: CookieAccessor
  ) {
    const { query } = parseURL(req.url as string, true);
    const { hash, redirectURL } = query;

    if (typeof redirectURL === 'object') {
      cookie.issueError(400, 'invalid redirect url');
      this._redirect(res, undefined);
      return;
    }

    if (typeof hash !== 'string') {
      cookie.issueError(400, 'invalid login parameters');
      this._redirect(res, redirectURL);
      return;
    }

    const paramsCheckingString = LOGIN_PARAMETERS.reduce(
      (str, key) => (query[key] ? `${str}\n${key}=${query[key]}` : str),
      ''
    ).slice(1);

    const hashedParams = createHmac('sha256', this.botToken)
      .update(paramsCheckingString)
      .digest('hex');

    if (hashedParams !== hash) {
      cookie.issueError(401, 'invalid login parameters');
      this._redirect(res, redirectURL);
      return;
    }

    if (Number(query.auth_date as string) < Date.now() / 1000 - 20) {
      cookie.issueError(401, 'login expired');
      this._redirect(res, redirectURL);
      return;
    }

    const authData: TelegramAuthData = {
      botId: this.botId,
      channel: null,
      user: {
        id: Number(query.id),
        is_bot: false,
        first_name: query.first_name as string,
        last_name: query.last_name as string | undefined,
        username: query.username as string | undefined,
      },
      photoURL: query.photo_url as string | undefined,
    };

    cookie.issueAuth(authData);
    this._redirect(res, redirectURL);
  }

  // eslint-disable-next-line class-methods-use-this
  async delegateAuthRequest(
    req: IncomingMessage,
    res: ServerResponse,
    cookie: CookieAccessor,
    routingInfo: RoutingInfo
  ): Promise<void> {
    if (routingInfo.trailingPath === 'codeGrant') {
      await this._authorizeCodeGrant(req, res, cookie);
    } else if (routingInfo.trailingPath === 'login') {
      this._authorizeLogin(req, res, cookie);
    }
  }

  // eslint-disable-next-line class-methods-use-this
  async verifyCredential(): Promise<AuthorizerVerifyResult<TelegramAuthData>> {
    return {
      success: false as const,
      code: 403,
      reason: 'should initiate st server side only',
    };
  }

  // eslint-disable-next-line class-methods-use-this
  async verifyRefreshment(
    data: TelegramAuthData
  ): Promise<AuthorizerVerifyResult<TelegramAuthData>> {
    return {
      success: true as const,
      data,
      refreshable: true,
    };
  }

  // eslint-disable-next-line class-methods-use-this
  async refineAuth(
    data: TelegramAuthData
  ): Promise<null | AuthorizerRefinement> {
    return refineTelegramAuthData(data);
  }
}

export const ServerAuthorizerP = provider<TelegramServerAuthorizer>({
  lifetime: 'singleton',
  deps: [PLATFORM_CONFIGS_I],
  factory: ({ botToken, authRedirectURL }: TelegramPlatformConfigs) => {
    invariant(
      authRedirectURL,
      'must provide configs.authRedirectURL to authorize with Telegram'
    );
    const botId = Number(botToken.split(':', 1)[0]);

    return new TelegramServerAuthorizer({
      botId,
      botToken,
      redirectURL: authRedirectURL,
    });
  },
})(TelegramServerAuthorizer);

export type ServerAuthorizerP = TelegramServerAuthorizer;
