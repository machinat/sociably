/// <reference lib="DOM" />
import type {
  AuthenticatorCredentialResult,
  ContextResult,
} from '@machinat/auth';
import type { WebviewClientAuthenticator } from '@machinat/webview';
import { parse as parseBrowser } from 'bowser';
import { TWITTER } from '../constant';
import TwitterChat from '../Chat';
import TwitterTweetTarget from '../TweetTarget';
import TwitterUser from '../User';
import TwitterUserProfile from '../UserProfile';
import { supplementContext } from './utils';
import type { TwitterAuthContext, TwitterAuthData } from './types';

type TwitterClientOptions = {
  /** The agent user id */
  agentId?: string;
};

/* eslint-disable class-methods-use-this */
export default class TwitterClientAuthenticator
  implements
    WebviewClientAuthenticator<void, TwitterAuthData, TwitterAuthContext>
{
  platform = TWITTER;
  agentId?: string;
  marshalTypes = [
    TwitterChat,
    TwitterTweetTarget,
    TwitterUser,
    TwitterUserProfile,
  ];

  constructor({ agentId }: TwitterClientOptions = {}) {
    this.agentId = agentId;
  }

  async init(
    authEntry: string,
    error: null | Error,
    data: null | TwitterAuthData
  ): Promise<void> {
    if (!error && !data) {
      window.location.href = `${authEntry}?redirectUrl=${encodeURIComponent(
        window.location.href
      )}`;

      await new Promise((resolve) => setTimeout(resolve, 5000));
      throw new Error('redirect timeout');
    }
  }

  async fetchCredential(): Promise<AuthenticatorCredentialResult<void>> {
    return {
      success: false as const,
      code: 400,
      reason: 'should only initiate from backend',
    };
  }

  // eslint-disable-next-line class-methods-use-this
  checkAuthContext(data: TwitterAuthData): ContextResult<TwitterAuthContext> {
    return {
      success: true,
      contextSupplment: supplementContext(data),
    };
  }

  closeWebview(): boolean {
    if (
      !this.agentId ||
      parseBrowser(window.navigator.userAgent).platform.type === 'desktop'
    ) {
      return false;
    }

    window.location.href = `https://twitter.com/messages/compose?recipient_id=${this.agentId}`;
    return true;
  }
}
