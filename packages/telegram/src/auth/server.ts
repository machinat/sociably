import { parse as parseURL } from 'url';
import { createHmac } from 'crypto';
import type { IncomingMessage, ServerResponse } from 'http';
import invariant from 'invariant';
import { provider } from '@machinat/core/service';
import type {
  ServerAuthorizer,
  CookieAccessor,
  AuthorizerVerifyResult,
} from '@machinat/auth/types';
import type { RoutingInfo } from '@machinat/http/types';

import { PLATFORM_CONFIGS_I } from '../interface';
import { TELEGRAM } from '../constant';
import { TelegramChat } from '../channel';
import TelegramUser from '../user';
import type { TelegramPlatformConfigs } from '../types';
import type { TelegramAuthData, TelegramAuthRefinement } from './types';
import { refineTelegramAuthData } from './utils';

type TelegramServerAuthorizerOpts = {
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

const makeParamsCheckingString = (query) =>
  LOGIN_PARAMETERS.reduce(
    (str, key) => (query[key] ? `${str}\n${key}=${query[key]}` : str),
    ''
  ).slice(1);

/**
 * @category Provider
 */
export class TelegramServerAuthorizer
  implements
    ServerAuthorizer<
      TelegramUser,
      null | TelegramChat,
      TelegramAuthData,
      void
    > {
  botToken: string;
  botId: number;
  redirectURL: string;

  platform = TELEGRAM;

  constructor(
    { botToken, redirectURL }: TelegramServerAuthorizerOpts = {} as any
  ) {
    invariant(botToken, 'options.botToken should not be empty');
    invariant(redirectURL, 'options.redirectURL should not be empty');

    this.botToken = botToken;
    this.botId = Number(botToken.split(':', 1)[0]);
    this.redirectURL = redirectURL;
  }

  private _redirect(res: ServerResponse, redirectURL: undefined | string) {
    res.writeHead(302, { Location: redirectURL || this.redirectURL });
    res.end();
  }

  private _authorizeLogin(
    req: IncomingMessage,
    res: ServerResponse,
    authIssuer: CookieAccessor
  ) {
    const { query } = parseURL(req.url as string, true);
    const { hash, redirectURL } = query;

    if (typeof redirectURL !== 'string' && typeof redirectURL !== 'undefined') {
      authIssuer.issueError(400, 'invalid redirect url');
      this._redirect(res, undefined);
      return;
    }

    if (typeof hash !== 'string') {
      authIssuer.issueError(400, 'invalid login parameters');
      this._redirect(res, redirectURL);
      return;
    }

    const paramsCheckingString = makeParamsCheckingString(query);

    const hashedParams = createHmac('sha256', this.botToken)
      .update(paramsCheckingString)
      .digest('hex');

    if (hashedParams !== hash) {
      authIssuer.issueError(401, 'invalid login signature');
      this._redirect(res, redirectURL);
      return;
    }

    if (Number(query.auth_date as string) < Date.now() / 1000 - 20) {
      authIssuer.issueError(401, 'login expired');
      this._redirect(res, redirectURL);
      return;
    }

    const authData: TelegramAuthData = {
      botId: this.botId,
      channel: null,
      userId: Number(query.id),
      firstName: query.first_name as string,
      lastName: query.last_name as string | undefined,
      username: query.username as string | undefined,
      photoURL: query.photo_url as string | undefined,
    };

    authIssuer.issueAuth(authData);
    this._redirect(res, redirectURL);
  }

  // eslint-disable-next-line class-methods-use-this
  async delegateAuthRequest(
    req: IncomingMessage,
    res: ServerResponse,
    authIssuer: CookieAccessor,
    routingInfo: RoutingInfo
  ): Promise<void> {
    if (routingInfo.trailingPath === 'login') {
      this._authorizeLogin(req, res, authIssuer);
    } else {
      res.writeHead(404);
      res.end();
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
  ): Promise<null | TelegramAuthRefinement> {
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

    return new TelegramServerAuthorizer({
      botToken,
      redirectURL: authRedirectURL,
    });
  },
})(TelegramServerAuthorizer);

export type ServerAuthorizerP = TelegramServerAuthorizer;
