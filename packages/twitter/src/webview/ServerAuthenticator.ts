import { serviceProviderClass } from '@sociably/core/service';
import {
  ServerAuthenticator,
  VerifyResult,
  CheckDataResult,
} from '@sociably/auth';
import BasicAuthenticator from '@sociably/auth/basicAuth';
import TwitterApiError from '../Error';
import BotP from '../Bot';
import ProfilerP from '../Profiler';
import { TWITTER } from '../constant';
import TwitterChat from '../Chat';
import TwitterUser from '../User';
import { getAuthContextDetails } from './utils';
import type {
  TwitterAuthContext,
  TwitterAuthData,
  TwitterAuthCredential,
} from './types';

/**
 * @category Provider
 */
export class TwitterServerAuthenticator
  implements ServerAuthenticator<never, TwitterAuthData, TwitterAuthContext>
{
  profiler: ProfilerP;
  basicAuthenticator: BasicAuthenticator;
  delegateAuthRequest: ServerAuthenticator<
    TwitterAuthCredential,
    TwitterAuthData,
    TwitterAuthContext
  >['delegateAuthRequest'];

  platform = TWITTER;

  constructor(
    bot: BotP,
    profiler: ProfilerP,
    basicAuthenticator: BasicAuthenticator
  ) {
    this.profiler = profiler;
    this.basicAuthenticator = basicAuthenticator;
    this.delegateAuthRequest = this.basicAuthenticator.createRequestDelegator<
      TwitterAuthCredential,
      TwitterAuthData,
      TwitterChat
    >({
      bot,
      platform: TWITTER,
      platformName: 'Twitter',
      platformColor: '#1D9BF0',
      platformImageUrl: 'https://sociably.js.org/img/icon/twitter.png',
      verifyCredential: (credential) =>
        this._verifyUserProfilePermission(credential),
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
      getChatLink: (chat) =>
        `https://twitter.com/messages/compose?recipient_id=${chat.agentId}`,
    });
  }

  getAuthUrl(agentId: string, userId: string, redirectUrl?: string): string {
    return this.basicAuthenticator.getAuthUrl<TwitterAuthCredential>(
      TWITTER,
      { agent: agentId, user: userId },
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

  async verifyRefreshment({
    agent: agentId,
    user: { id: userId },
  }: TwitterAuthData): Promise<VerifyResult<TwitterAuthData>> {
    return this._verifyUserProfilePermission({ agent: agentId, user: userId });
  }

  // eslint-disable-next-line class-methods-use-this
  checkAuthData(data: TwitterAuthData): CheckDataResult<TwitterAuthContext> {
    return {
      ok: true,
      contextDetails: getAuthContextDetails(data),
    };
  }

  private async _verifyUserProfilePermission({
    agent: agentId,
    user: userId,
  }: TwitterAuthCredential) {
    try {
      const userProfile = await this.profiler.getUserProfile(
        new TwitterUser(agentId),
        new TwitterUser(userId)
      );
      return {
        ok: true as const,
        data: {
          agent: agentId,
          user: { id: userId, data: userProfile.data.user },
        },
      };
    } catch (err) {
      return {
        ok: false as const,
        code: err instanceof TwitterApiError ? err.statusCode : 500,
        reason: err.message,
      };
    }
  }
}

const ServerAuthenticatorP = serviceProviderClass({
  lifetime: 'singleton',
  deps: [BotP, BasicAuthenticator],
})(TwitterServerAuthenticator);

type ServerAuthenticatorP = TwitterServerAuthenticator;

export default ServerAuthenticatorP;
