import { makeClassProvider } from '@sociably/core/service';
import {
  ServerAuthenticator,
  VerifyResult,
  CheckDataResult,
} from '@sociably/auth';
import BasicAuthenticator from '@sociably/auth/basicAuth';
import BotP from '../Bot';
import { FACEBOOK } from '../constant';
import FacebookChat from '../Chat';
import { getAuthContextDetails } from './utils';
import type { FacebookAuthContext, FacebookAuthData } from './types';

/**
 * @category Provider
 */
export class FacebookServerAuthenticator
  implements ServerAuthenticator<never, FacebookAuthData, FacebookAuthContext>
{
  bot: BotP;
  basicAuthenticator: BasicAuthenticator;
  delegateAuthRequest: ServerAuthenticator<
    never,
    FacebookAuthData,
    FacebookAuthContext
  >['delegateAuthRequest'];

  platform = FACEBOOK;

  constructor(bot: BotP, basicAuthenticator: BasicAuthenticator) {
    this.bot = bot;
    this.basicAuthenticator = basicAuthenticator;
    this.delegateAuthRequest = this.basicAuthenticator.createRequestDelegator<
      FacebookAuthData,
      FacebookChat
    >({
      bot,
      platform: FACEBOOK,
      platformName: 'Facebook',
      platformColor: '#4B69FF',
      platformImageUrl: 'https://sociably.js.org/img/icon/messenger.png',
      checkAuthData: (data) => {
        const result = this.checkAuthData(data);
        if (!result.ok) {
          return result;
        }

        return {
          ok: true,
          data,
          thread: result.contextDetails.thread,
        };
      },
      getChatLink: () => `https://m.me/${this.bot.pageId}`,
    });
  }

  getAuthUrl(userId: string, redirectUrl?: string): string {
    return this.basicAuthenticator.getAuthUrl<FacebookAuthData>(
      FACEBOOK,
      { id: userId, page: this.bot.pageId },
      redirectUrl
    );
  }

  // eslint-disable-next-line class-methods-use-this
  async verifyCredential(): Promise<VerifyResult<FacebookAuthData>> {
    return {
      ok: false as const,
      code: 403,
      reason: 'should use backend based flow only',
    };
  }

  async verifyRefreshment(
    data: FacebookAuthData
  ): Promise<VerifyResult<FacebookAuthData>> {
    if (data.page !== this.bot.pageId) {
      return { ok: false, code: 400, reason: 'page not match' };
    }
    return { ok: true, data };
  }

  checkAuthData(data: FacebookAuthData): CheckDataResult<FacebookAuthContext> {
    if (data.page !== this.bot.pageId) {
      return { ok: false, code: 400, reason: 'page not match' };
    }

    return {
      ok: true,
      contextDetails: getAuthContextDetails(data),
    };
  }
}

const ServerAuthenticatorP = makeClassProvider({
  lifetime: 'singleton',
  deps: [BotP, BasicAuthenticator],
})(FacebookServerAuthenticator);

type ServerAuthenticatorP = FacebookServerAuthenticator;

export default ServerAuthenticatorP;
