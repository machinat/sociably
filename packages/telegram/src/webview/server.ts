import { parse as parseUrl } from 'url';
import type { ParsedUrlQuery } from 'querystring';
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
import { BotP } from '../bot';
import type TelegramApiError from '../error';
import type { TelegramPlatformConfigs, RawChat, RawUser } from '../types';
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

/**
 * @category Provider
 */
export class TelegramServerAuthorizer
  implements ServerAuthorizer<never, TelegramAuthData, TelegramAuthContext> {
  bot: BotP;
  redirectUrl: string;

  platform = TELEGRAM;

  constructor(bot: BotP, options: TelegramServerAuthorizerOpts) {
    invariant(options?.redirectUrl, 'options.redirectUrl should not be empty');

    this.bot = bot;
    this.redirectUrl = options.redirectUrl;
  }

  async delegateAuthRequest(
    req: IncomingMessage,
    res: ServerResponse,
    authIssuer: CookieAccessor
  ): Promise<void> {
    const { query } = parseUrl(req.url as string, true);
    const { redirectUrl, [CHAT_QUERY_PARAM]: chatIdQuery } = query;

    if (typeof redirectUrl !== 'string' && typeof redirectUrl !== 'undefined') {
      authIssuer.issueError(400, 'invalid redirect url');
      this._redirect(res, undefined);
      return;
    }

    const loginErr = this._verifyTelegramLogin(query);
    if (loginErr) {
      authIssuer.issueError(loginErr.code, loginErr.message);
      this._redirect(res, redirectUrl);
      return;
    }

    const userData: Omit<RawUser, 'is_bot'> = {
      id: Number(query.id),
      username: query.username as string | undefined,
      first_name: query.first_name as string,
      last_name: query.last_name as string | undefined,
      language_code: undefined,
    };

    let chatData: undefined | RawChat;
    if (chatIdQuery) {
      const chatId =
        typeof chatIdQuery === 'string' && chatIdQuery[0] === '@'
          ? chatIdQuery
          : Number(chatIdQuery);

      if (Number.isNaN(chatId)) {
        authIssuer.issueError(400, 'invalid chat id');
        this._redirect(res, redirectUrl);
        return;
      }

      const [err, chatResult, userResult] = await this._checkChatMember(
        chatId,
        userData.id
      );

      if (err) {
        authIssuer.issueError(err.code, err.message);
        this._redirect(res, redirectUrl);
        return;
      }

      userData.language_code = userResult.language_code;
      chatData = {
        type: chatResult.type,
        id: chatResult.id,
        title: chatResult.title,
        username: chatResult.username,
        description: chatResult.description,
      };
    }

    authIssuer.issueAuth({
      botId: this.bot.id,
      chat: chatData,
      user: userData,
      photoUrl: query.photo_url as string | undefined,
    });
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

  async verifyRefreshment(
    data: TelegramAuthData
  ): Promise<AuthorizerVerifyResult<TelegramAuthData>> {
    if (data.botId !== this.bot.id) {
      return {
        success: false,
        code: 400,
        reason: 'bot not match',
      };
    }

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

  private _redirect(res: ServerResponse, redirectUrl?: string) {
    res.writeHead(302, { Location: redirectUrl || this.redirectUrl });
    res.end();
  }

  private _verifyTelegramLogin(
    query: ParsedUrlQuery
  ): null | { code: number; message: string } {
    const { hash } = query;
    if (typeof hash !== 'string') {
      return { code: 400, message: 'invalid login parameters' };
    }

    const paramsCheckingString = LOGIN_PARAMETERS.reduce(
      (str, key) => (query[key] ? `${str}\n${key}=${query[key]}` : str),
      ''
    ).slice(1);

    const hashedParams = createHmac('sha256', this.bot.token)
      .update(paramsCheckingString)
      .digest('hex');

    if (hashedParams !== hash) {
      return { code: 401, message: 'invalid login signature' };
    }

    if (Number(query.auth_date as string) < Date.now() / 1000 - 20) {
      return { code: 401, message: 'login expired' };
    }

    return null;
  }

  private async _checkChatMember(
    chatId: number | string,
    userId: number
  ): Promise<[null | { code: number; message: string }, RawChat, RawUser]> {
    try {
      const chatMember = await this.bot.makeApiCall('getChatMember', {
        chat_id: chatId,
        user_id: userId,
      });

      if (
        chatMember.status === 'left' ||
        chatMember.status === 'kicked' ||
        (chatMember.status === 'restricted' && chatMember.is_member === false)
      ) {
        const err = { code: 401, message: 'user is unauthorized to chat' };
        return [err, null as never, null as never];
      }

      const chatResult: RawChat = await this.bot.makeApiCall('getChat', {
        chat_id: chatId,
      });

      return [null, chatResult, chatMember.user];
    } catch (err) {
      const { code, description }: TelegramApiError = err;
      return [{ code, message: description }, null as never, null as never];
    }
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
