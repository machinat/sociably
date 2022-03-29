import { makeClassProvider } from '@machinat/core/service';
import {
  ServerAuthenticator,
  VerifyResult,
  CheckDataResult,
} from '@machinat/auth';
import BasicAuthenticator from '@machinat/auth/basicAuth';
import BotP from '../Bot';
import { MESSENGER } from '../constant';
import MessengerChat from '../Chat';
import { getAuthContextDetails } from './utils';
import type { MessengerAuthContext, MessengerAuthData } from './types';

/**
 * @category Provider
 */
export class MessengerServerAuthenticator
  implements
    ServerAuthenticator<never, MessengerAuthData, MessengerAuthContext>
{
  bot: BotP;
  basicAuthenticator: BasicAuthenticator;
  delegateAuthRequest: ServerAuthenticator<
    never,
    MessengerAuthData,
    MessengerAuthContext
  >['delegateAuthRequest'];

  platform = MESSENGER;

  constructor(bot: BotP, basicAuthenticator: BasicAuthenticator) {
    this.bot = bot;
    this.basicAuthenticator = basicAuthenticator;
    this.delegateAuthRequest = this.basicAuthenticator.createRequestDelegator<
      MessengerAuthData,
      MessengerChat
    >({
      bot,
      platform: MESSENGER,
      platformName: 'Messenger',
      platformColor: '#635BFF',
      platformImageUrl: 'https://machinat.com/img/icon/messenger.png',
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
      getChatLink: () => `https://m.me/${this.bot.pageId}`,
    });
  }

  getAuthUrl(userId: string, redirectUrl?: string): string {
    return this.basicAuthenticator.getAuthUrl<MessengerAuthData>(
      MESSENGER,
      { id: userId, page: this.bot.pageId },
      redirectUrl
    );
  }

  // eslint-disable-next-line class-methods-use-this
  async verifyCredential(): Promise<VerifyResult<MessengerAuthData>> {
    return {
      ok: false as const,
      code: 403,
      reason: 'should use backend based flow only',
    };
  }

  async verifyRefreshment(
    data: MessengerAuthData
  ): Promise<VerifyResult<MessengerAuthData>> {
    if (data.page !== this.bot.pageId) {
      return { ok: false, code: 400, reason: 'page not match' };
    }
    return { ok: true, data };
  }

  checkAuthData(
    data: MessengerAuthData
  ): CheckDataResult<MessengerAuthContext> {
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
})(MessengerServerAuthenticator);

type ServerAuthenticatorP = MessengerServerAuthenticator;

export default ServerAuthenticatorP;
