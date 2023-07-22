import { serviceProviderClass } from '@sociably/core/service';
import {
  ServerAuthenticator,
  VerifyResult,
  CheckDataResult,
} from '@sociably/auth';
import BasicAuthenticator from '@sociably/auth/basicAuth';
import { MetaApiError } from '@sociably/meta-api';
import BotP from '../Bot.js';
import ProfilerP from '../Profiler.js';
import InstagramPage from '../Page.js';
import InstagramChat from '../Chat.js';
import InstagramUser from '../User.js';
import { INSTAGRAM } from '../constant.js';
import { AgentSettingsAccessorI } from '../interface.js';
import { getAuthContextDetails } from './utils.js';
import type { InstagramAuthContext, InstagramAuthData } from './types.js';

/**
 * @category Provider
 */
export class InstagramServerAuthenticator
  implements
    ServerAuthenticator<never, InstagramAuthData, InstagramAuthContext>
{
  private profiler: ProfilerP;
  basicAuthenticator: BasicAuthenticator;
  settingsAccessor: AgentSettingsAccessorI;
  delegateAuthRequest: ServerAuthenticator<
    never,
    InstagramAuthData,
    InstagramAuthContext
  >['delegateAuthRequest'];

  platform = INSTAGRAM;

  constructor(
    bot: BotP,
    profiler: ProfilerP,
    basicAuthenticator: BasicAuthenticator,
    settingsAccessor: AgentSettingsAccessorI
  ) {
    this.profiler = profiler;
    this.basicAuthenticator = basicAuthenticator;
    this.settingsAccessor = settingsAccessor;
    this.delegateAuthRequest = this.basicAuthenticator.createRequestDelegator<
      InstagramAuthData,
      InstagramAuthData,
      InstagramChat
    >({
      bot,
      platform: INSTAGRAM,
      platformName: 'Instagram',
      platformColor: '#4B69FF',
      platformImageUrl: 'https://sociably.js.org/img/icon/messenger.png',
      checkCurrentAuthUsability: (credential, data) => ({
        ok:
          credential.agent.page === data.agent.page &&
          credential.user === data.user,
      }),
      verifyCredential: async (credential) => {
        const {
          agent: { page: pageId },
          user: userId,
        } = credential;
        return this._verifyUser(pageId, userId);
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
          chatLinkUrl: `https://ig.me/m/${data.agent.name}`,
        };
      },
    });
  }

  async getAuthUrl(user: InstagramUser, redirectUrl?: string): Promise<string> {
    const page = new InstagramPage(user.pageId);
    const settings = await this.settingsAccessor.getAgentSettings(page);
    if (!settings) {
      throw new Error(`page "${page.username}" not registered`);
    }

    return this.basicAuthenticator.getAuthUrl<InstagramAuthData>(
      INSTAGRAM,
      {
        agent: {
          page: user.pageId,
          name: settings.username,
        },
        user: user.id,
      },
      redirectUrl
    );
  }

  // eslint-disable-next-line class-methods-use-this
  async verifyCredential(): Promise<VerifyResult<InstagramAuthData>> {
    return {
      ok: false as const,
      code: 403,
      reason: 'should use backend based flow only',
    };
  }

  async verifyRefreshment(
    data: InstagramAuthData
  ): Promise<VerifyResult<InstagramAuthData>> {
    return this._verifyUser(data.agent.page, data.user);
  }

  // eslint-disable-next-line class-methods-use-this
  checkAuthData(
    data: InstagramAuthData
  ): CheckDataResult<InstagramAuthContext> {
    return {
      ok: true,
      contextDetails: getAuthContextDetails(data),
    };
  }

  private async _verifyUser(
    pageId: string,
    userId: string
  ): Promise<VerifyResult<InstagramAuthData>> {
    try {
      const [settings, userProfile] = await Promise.all([
        this.settingsAccessor.getAgentSettings(new InstagramPage(pageId)),
        this.profiler.getUserProfile(
          new InstagramPage(pageId),
          new InstagramUser(pageId, userId)
        ),
      ]);

      return settings
        ? {
            ok: true,
            data: {
              agent: { page: pageId, name: settings.username },
              user: userId,
              profile: userProfile?.data,
            },
          }
        : { ok: false, code: 404, reason: `page "${pageId}" not registered` };
    } catch (err) {
      return err instanceof MetaApiError && err.code === 404
        ? {
            ok: false,
            code: 404,
            reason: `user "${userId}" not found or not authorized`,
          }
        : {
            ok: false,
            code: err instanceof MetaApiError ? err.code : 500,
            reason: err.message,
          };
    }
  }
}

const ServerAuthenticatorP = serviceProviderClass({
  lifetime: 'singleton',
  deps: [BotP, ProfilerP, BasicAuthenticator, AgentSettingsAccessorI],
})(InstagramServerAuthenticator);

type ServerAuthenticatorP = InstagramServerAuthenticator;

export default ServerAuthenticatorP;
