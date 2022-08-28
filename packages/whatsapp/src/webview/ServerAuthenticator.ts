import { makeClassProvider } from '@sociably/core/service';
import {
  ServerAuthenticator,
  VerifyResult,
  CheckDataResult,
} from '@sociably/auth';
import BasicAuthenticator from '@sociably/auth/basicAuth';
import BotP from '../Bot';
import { WHATSAPP } from '../constant';
import WhatsAppChat from '../Chat';
import { getAuthContextDetails } from './utils';
import type { WhatsAppAuthContext, WhatsAppAuthData } from './types';

/**
 * @category Provider
 */
export class WhatsAppServerAuthenticator
  implements ServerAuthenticator<never, WhatsAppAuthData, WhatsAppAuthContext>
{
  bot: BotP;
  basicAuthenticator: BasicAuthenticator;
  delegateAuthRequest: ServerAuthenticator<
    never,
    WhatsAppAuthData,
    WhatsAppAuthContext
  >['delegateAuthRequest'];

  platform = WHATSAPP;

  constructor(bot: BotP, basicAuthenticator: BasicAuthenticator) {
    this.bot = bot;
    this.basicAuthenticator = basicAuthenticator;
    this.delegateAuthRequest = this.basicAuthenticator.createRequestDelegator<
      WhatsAppAuthData,
      WhatsAppChat
    >({
      bot,
      platform: WHATSAPP,
      platformName: 'WhatsApp',
      platformColor: '#31BA45',
      platformImageUrl: 'https://sociably.js.org/img/icon/whatsapp.png',
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
      getChatLink: () => `https://wa.me/${this.bot.businessNumber}`,
    });
  }

  getAuthUrlSuffix(customerNumber: string, redirectUrl?: string): string {
    const url = new URL(
      this.basicAuthenticator.getAuthUrl<WhatsAppAuthData>(
        WHATSAPP,
        { customer: customerNumber, business: this.bot.businessNumber },
        redirectUrl
      )
    );
    return `${url.pathname}${url.search}${url.hash}`;
  }

  // eslint-disable-next-line class-methods-use-this
  async verifyCredential(): Promise<VerifyResult<WhatsAppAuthData>> {
    return {
      ok: false as const,
      code: 403,
      reason: 'should use backend based flow only',
    };
  }

  async verifyRefreshment(
    data: WhatsAppAuthData
  ): Promise<VerifyResult<WhatsAppAuthData>> {
    if (data.business !== this.bot.businessNumber) {
      return { ok: false, code: 400, reason: 'business number not match' };
    }
    return { ok: true, data };
  }

  checkAuthData(data: WhatsAppAuthData): CheckDataResult<WhatsAppAuthContext> {
    if (data.business !== this.bot.businessNumber) {
      return { ok: false, code: 400, reason: 'business number not match' };
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
})(WhatsAppServerAuthenticator);

type ServerAuthenticatorP = WhatsAppServerAuthenticator;

export default ServerAuthenticatorP;
