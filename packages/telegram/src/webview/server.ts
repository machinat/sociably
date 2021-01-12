import { parse as parseUrl } from 'url';
import { createHmac } from 'crypto';
import type { IncomingMessage, ServerResponse } from 'http';
import invariant from 'invariant';
import { makeClassProvider } from '@machinat/core/service';
import type {
  ServerAuthorizer,
  CookieAccessor,
  AuthorizerVerifyResult,
  ContextSupplement,
} from '@machinat/auth/types';

import { PLATFORM_CONFIGS_I } from '../interface';
import { TELEGRAM } from '../constant';
import type { TelegramPlatformConfigs, RawChat } from '../types';
import { BotP } from '../bot';
import { supplementContext } from './utils';
import type { TelegramAuthContext, TelegramAuthData } from './types';

type TelegramServerAuthorizerOpts = {
  redirectUrl: string;
};

const CHAT_QUERY_PARAM = 'telegramChat';

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
  implements ServerAuthorizer<never, TelegramAuthData, TelegramAuthContext> {
  bot: BotP;
  redirectUrl: string;

  platform = TELEGRAM;

  constructor(bot: BotP, { redirectUrl }: TelegramServerAuthorizerOpts) {
    invariant(redirectUrl, 'options.redirectUrl should not be empty');

    this.bot = bot;
    this.redirectUrl = redirectUrl;
  }

  private _redirect(res: ServerResponse, redirectUrl: undefined | string) {
    res.writeHead(302, { Location: redirectUrl || this.redirectUrl });
    res.end();
  }

  async delegateAuthRequest(
    req: IncomingMessage,
    res: ServerResponse,
    authIssuer: CookieAccessor
  ): Promise<void> {
    const { query } = parseUrl(req.url as string, true);
    const { hash, redirectUrl, [CHAT_QUERY_PARAM]: chatIdQuery } = query;

    if (typeof redirectUrl !== 'string' && typeof redirectUrl !== 'undefined') {
      authIssuer.issueError(400, 'invalid redirect url');
      this._redirect(res, undefined);
      return;
    }

    if (typeof hash !== 'string') {
      authIssuer.issueError(400, 'invalid login parameters');
      this._redirect(res, redirectUrl);
      return;
    }

    const paramsCheckingString = makeParamsCheckingString(query);

    const hashedParams = createHmac('sha256', this.bot.token)
      .update(paramsCheckingString)
      .digest('hex');

    if (hashedParams !== hash) {
      authIssuer.issueError(401, 'invalid login signature');
      this._redirect(res, redirectUrl);
      return;
    }

    if (Number(query.auth_date as string) < Date.now() / 1000 - 20) {
      authIssuer.issueError(401, 'login expired');
      this._redirect(res, redirectUrl);
      return;
    }

    const userId = Number(query.id);
    const username = query.username as string | undefined;

    let chatData: undefined | RawChat;

    if (chatIdQuery) {
      const chatId =
        typeof chatIdQuery === 'string' && chatIdQuery[0] === '@'
          ? chatIdQuery
          : Number(chatIdQuery);

      if (Number.isNaN(chatId)) {
        authIssuer.issueError(400, 'invalid chat id');
        this._redirect(res, undefined);
        return;
      }

      const chatMember = await this.bot.makeApiCall('getChatMember', {
        chat_id: chatId,
        user_id: userId,
      });

      if (
        chatMember.status === 'left' ||
        chatMember.status === 'kicked' ||
        (chatMember.status === 'restricted' && chatMember.is_member === false)
      ) {
        authIssuer.issueError(401, 'user is unauthorized to chat');
        this._redirect(res, undefined);
        return;
      }

      const chatResult: RawChat = await this.bot.makeApiCall('getChat', {
        chat_id: chatId,
      });

      chatData = {
        type: chatResult.type,
        id: chatResult.id,
        title: chatResult.title,
        username: chatResult.username,
        description: chatResult.description,
      };
    }

    const authData: TelegramAuthData = {
      botId: this.bot.id,
      chat: chatData,
      userId,
      username,
      firstName: query.first_name as string,
      lastName: query.last_name as string | undefined,
      photoUrl: query.photo_url as string | undefined,
    };

    authIssuer.issueAuth(authData);
    this._redirect(res, redirectUrl);
  }

  // eslint-disable-next-line class-methods-use-this
  async verifyCredential(): Promise<AuthorizerVerifyResult<never>> {
    return {
      success: false,
      code: 403,
      reason: 'should initiate st server side only',
    };
  }

  // eslint-disable-next-line class-methods-use-this
  async verifyRefreshment(
    data: TelegramAuthData
  ): Promise<AuthorizerVerifyResult<TelegramAuthData>> {
    return {
      success: true,
      data,
    };
  }

  // eslint-disable-next-line class-methods-use-this
  async supplementContext(
    data: TelegramAuthData
  ): Promise<null | ContextSupplement<TelegramAuthContext>> {
    return supplementContext(data);
  }
}

export const ServerAuthorizerP = makeClassProvider({
  lifetime: 'singleton',
  deps: [BotP, PLATFORM_CONFIGS_I] as const,
  factory: (bot, { authRedirectUrl }: TelegramPlatformConfigs) => {
    invariant(
      authRedirectUrl,
      'must provide configs.authRedirectUrl to authorize with Telegram'
    );

    return new TelegramServerAuthorizer(bot, {
      redirectUrl: authRedirectUrl,
    });
  },
})(TelegramServerAuthorizer);

export type ServerAuthorizerP = TelegramServerAuthorizer;
