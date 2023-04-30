import { makeClassProvider } from '@sociably/core/service';
import {
  ServerAuthenticator,
  VerifyResult,
  CheckDataResult,
} from '@sociably/auth';
import BasicAuthenticator from '@sociably/auth/basicAuth';
import BotP from '../Bot';
import { WHATSAPP } from '../constant';
import { AgentSettingsAccessorI } from '../interface';
import WhatsAppChat from '../Chat';
import WhatsAppAgent from '../Agent';
import { getAuthContextDetails, trimWaUrlNumber } from './utils';
import type {
  WhatsAppAuthContext,
  WhatsAppAuthData,
  WhatsAppAuthCrendential,
} from './types';

/**
 * @category Provider
 */
export class WhatsAppServerAuthenticator
  implements ServerAuthenticator<never, WhatsAppAuthData, WhatsAppAuthContext>
{
  bot: BotP;
  basicAuthenticator: BasicAuthenticator;
  numberSettingsAccessor: AgentSettingsAccessorI;

  delegateAuthRequest: ServerAuthenticator<
    never,
    WhatsAppAuthData,
    WhatsAppAuthContext
  >['delegateAuthRequest'];

  platform = WHATSAPP;

  constructor(
    bot: BotP,
    basicAuthenticator: BasicAuthenticator,
    numberSettingsAccessor: AgentSettingsAccessorI
  ) {
    this.bot = bot;
    this.basicAuthenticator = basicAuthenticator;
    this.numberSettingsAccessor = numberSettingsAccessor;
    this.delegateAuthRequest = this.basicAuthenticator.createRequestDelegator<
      WhatsAppAuthCrendential,
      WhatsAppAuthData,
      WhatsAppChat
    >({
      bot,
      platform: WHATSAPP,
      platformName: 'WhatsApp',
      platformColor: '#31BA45',
      platformImageUrl: 'https://sociably.js.org/img/icon/whatsapp.png',
      verifyCredential: async ({
        agent: agentNumberId,
        user: userNumberId,
      }) => {
        const settings = await this.numberSettingsAccessor.getChannelSettings(
          new WhatsAppAgent(agentNumberId)
        );
        if (!settings) {
          return {
            ok: false,
            code: 404,
            reason: `agent number "${agentNumberId}" not registered`,
          };
        }
        return {
          ok: true,
          data: {
            account: settings.accountId,
            agent: { id: agentNumberId, num: settings.phoneNumber },
            user: userNumberId,
          },
        };
      },
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
      getChatLink: (chat, data) =>
        `https://wa.me/${trimWaUrlNumber(data.agent.num)}`,
    });
  }

  getAuthUrlPostfix(chat: WhatsAppChat, redirectUrl?: string): string {
    const url = new URL(
      this.basicAuthenticator.getAuthUrl<WhatsAppAuthCrendential>(
        WHATSAPP,
        {
          agent: chat.agentNumberId,
          user: chat.userNumberId,
        },
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
    const agent = new WhatsAppAgent(data.agent.id);
    const numberSettings = await this.numberSettingsAccessor.getChannelSettings(
      agent
    );

    if (!numberSettings) {
      return {
        ok: false as const,
        code: 404,
        reason: `agent number "${data.agent.id}" not registered`,
      };
    }
    return { ok: true, data };
  }

  // eslint-disable-next-line class-methods-use-this
  checkAuthData(data: WhatsAppAuthData): CheckDataResult<WhatsAppAuthContext> {
    return {
      ok: true,
      contextDetails: getAuthContextDetails(data),
    };
  }
}

const ServerAuthenticatorP = makeClassProvider({
  lifetime: 'singleton',
  deps: [BotP, BasicAuthenticator, AgentSettingsAccessorI],
})(WhatsAppServerAuthenticator);

type ServerAuthenticatorP = WhatsAppServerAuthenticator;

export default ServerAuthenticatorP;
