import { makeClassProvider } from '@sociably/core/service';
import {
  ServerAuthenticator,
  VerifyResult,
  CheckDataResult,
} from '@sociably/auth';
import BasicAuthenticator from '@sociably/auth/basicAuth';
import BotP from '../Bot';
import { TWITTER } from '../constant';
import TwitterChat from '../Chat';
import { getAuthContextDetails } from './utils';
import type { TwitterAuthContext, TwitterAuthData } from './types';

/**
 * @category Provider
 */
export class TwitterServerAuthenticator
  implements ServerAuthenticator<never, TwitterAuthData, TwitterAuthContext>
{
  bot: BotP;
  basicAuthenticator: BasicAuthenticator;
  delegateAuthRequest: ServerAuthenticator<
    never,
    TwitterAuthData,
    TwitterAuthContext
  >['delegateAuthRequest'];

  platform = TWITTER;

  constructor(bot: BotP, basicAuthenticator: BasicAuthenticator) {
    this.bot = bot;
    this.basicAuthenticator = basicAuthenticator;
    this.delegateAuthRequest = this.basicAuthenticator.createRequestDelegator<
      TwitterAuthData,
      TwitterChat
    >({
      bot,
      platform: TWITTER,
      platformName: 'Twitter',
      platformColor: '#1D9BF0',
      platformImageUrl: 'https://sociably.js.org/img/icon/twitter.png',
      checkAuthData: (data) => {
        const result = this.checkAuthData(data);
        if (!result.ok) {
          return result;
        }

        return {
          ok: true,
          data,
          channel: result.contextDetails.channel,
        };
      },
      getChatLink: () =>
        `https://twitter.com/messages/compose?recipient_id=${this.bot.agentId}`,
    });
  }

  getAuthUrl(userId: string, redirectUrl?: string): string {
    return this.basicAuthenticator.getAuthUrl<TwitterAuthData>(
      TWITTER,
      { agent: this.bot.agentId, id: userId },
      redirectUrl
    );
  }

  // eslint-disable-next-line class-methods-use-this
  async verifyCredential(): Promise<VerifyResult<TwitterAuthData>> {
    return {
      ok: false as const,
      code: 403,
      reason: 'should use backend based flow only',
    };
  }

  async verifyRefreshment(
    data: TwitterAuthData
  ): Promise<VerifyResult<TwitterAuthData>> {
    if (data.agent !== this.bot.agentId) {
      return { ok: false, code: 400, reason: 'agent not match' };
    }
    return { ok: true, data };
  }

  checkAuthData(data: TwitterAuthData): CheckDataResult<TwitterAuthContext> {
    if (data.agent !== this.bot.agentId) {
      return { ok: false, code: 400, reason: 'agent not match' };
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
})(TwitterServerAuthenticator);

type ServerAuthenticatorP = TwitterServerAuthenticator;

export default ServerAuthenticatorP;
