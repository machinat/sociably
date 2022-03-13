import { parse as parseUrl } from 'url';
import fetch from 'node-fetch';
import { parse as parseQuery } from 'querystring';
import type { IncomingMessage, ServerResponse } from 'http';
import { makeClassProvider } from '@machinat/core/service';
import type {
  ServerAuthenticator,
  HttpAuthHelper,
  VerifyResult,
  ContextResult,
} from '@machinat/auth';
import type { RoutingInfo } from '@machinat/http';
import BotP from '../Bot';
import { ConfigsI } from '../interface';
import { TWITTER } from '../constant';
import TwitterApiError from '../Error';
import { RawUser } from '../types';
import { supplementContext } from './utils';
import type { TwitterAuthContext, TwitterAuthData } from './types';

type OauthState = {
  oauthToken: string;
  oauthSecret: string;
  redirectUrl: string;
};

const REDIRECT_QUERY = 'redirectUrl';

/**
 * @category Provider
 */
export class TwitterServerAuthenticator
  implements ServerAuthenticator<never, TwitterAuthData, TwitterAuthContext>
{
  bot: BotP;
  platform = TWITTER;

  constructor(bot: BotP) {
    this.bot = bot;
  }

  async delegateAuthRequest(
    req: IncomingMessage,
    res: ServerResponse,
    authHelper: HttpAuthHelper,
    { trailingPath }: RoutingInfo
  ): Promise<void> {
    try {
      if (trailingPath === '') {
        await this._handleOauthStart(req, res, authHelper);
      } else if (trailingPath === 'callback') {
        await this._handleOauthCallback(req, res, authHelper);
      } else {
        await authHelper.issueError(404, 'invalid entry');
        authHelper.redirect();
      }
    } catch (e) {
      const err: TwitterApiError = e;
      await authHelper.issueError(err.statusCode || 500, err.message);
      authHelper.redirect();
    }
  }

  // eslint-disable-next-line class-methods-use-this
  async verifyCredential(): Promise<VerifyResult<never>> {
    return {
      success: false,
      code: 403,
      reason: 'should initiate st server side only',
    };
  }

  async verifyRefreshment(
    data: TwitterAuthData
  ): Promise<VerifyResult<TwitterAuthData>> {
    if (data.agent !== this.bot.agentId) {
      return { success: false, code: 400, reason: 'agent not match' };
    }
    return { success: true, data };
  }

  // eslint-disable-next-line class-methods-use-this
  checkAuthContext(data: TwitterAuthData): ContextResult<TwitterAuthContext> {
    if (data.agent !== this.bot.agentId) {
      return { success: false, code: 400, reason: 'agent not match' };
    }

    return {
      success: true,
      contextSupplment: supplementContext(data),
    };
  }

  private async _handleOauthStart(
    req: IncomingMessage,
    res: ServerResponse,
    authHelper: HttpAuthHelper
  ) {
    const { [REDIRECT_QUERY]: redirectUrl } = parseQuery(
      parseUrl(req.url as string).query || ''
    );

    if (Array.isArray(redirectUrl)) {
      await authHelper.issueError(400, 'multiple redirectUrl query received');
      authHelper.redirect();
      return;
    }

    const callbackUrl = authHelper.getApiEntry('callback');

    const { body } = await this.bot.client.request(
      'POST',
      'oauth/request_token',
      { oauth_callback: callbackUrl, x_auth_access_type: 'read' }
    );

    const {
      oauth_token: oauthToken,
      oauth_token_secret: oauthSecret,
      oauth_callback_confirmed: callbackConfirmed,
    } = parseQuery(body as string);

    if (callbackConfirmed !== 'true') {
      await authHelper.issueError(400, 'request callback no confirmed');
      authHelper.redirect(redirectUrl);
      return;
    }

    await authHelper.issueState<OauthState>({
      oauthToken,
      oauthSecret,
      redirectUrl,
    } as OauthState);
    authHelper.redirect(
      `https://api.twitter.com/oauth/authenticate?oauth_token=${oauthToken}`
    );
  }

  private async _handleOauthCallback(
    req: IncomingMessage,
    res: ServerResponse,
    authHelper: HttpAuthHelper
  ) {
    const { oauth_token: oauthToken, oauth_verifier: oauthVerifier } =
      parseQuery(parseUrl(req.url as string).query || '');

    const state = await authHelper.getState<OauthState>();

    if (!state || state.oauthToken !== oauthToken) {
      await authHelper.issueError(400, 'invalid oauth request');
      authHelper.redirect();
      return;
    }

    const response = await fetch(
      `https://api.twitter.com/oauth/access_token?oauth_token=${oauthToken}&oauth_verifier=${oauthVerifier}`,
      { method: 'POST' }
    );
    const tokenBody = await response.text();
    if (!response.ok) {
      await authHelper.issueError(response.status, tokenBody);
      authHelper.redirect();
      return;
    }

    const { oauth_token: accessToken, oauth_token_secret: accessSecret } =
      parseQuery(tokenBody as string);

    const { body: rawUser } = await this.bot.client.request(
      'GET',
      '1.1/account/verify_credentials.json',
      undefined,
      { token: accessToken as string, secret: accessSecret as string }
    );

    await authHelper.issueAuth<TwitterAuthData>({
      agent: this.bot.agentId,
      id: (rawUser as RawUser).id_str,
    });
    authHelper.redirect(state.redirectUrl);
  }
}

const ServerAuthenticatorP = makeClassProvider({
  lifetime: 'singleton',
  deps: [BotP, ConfigsI],
  factory: (bot) => {
    return new TwitterServerAuthenticator(bot);
  },
})(TwitterServerAuthenticator);

type ServerAuthenticatorP = TwitterServerAuthenticator;

export default ServerAuthenticatorP;
