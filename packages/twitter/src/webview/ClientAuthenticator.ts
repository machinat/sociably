/// <reference lib="DOM" />
import type {
  AuthenticatorCredentialResult,
  CheckDataResult,
} from '@machinat/auth';
import type { WebviewClientAuthenticator } from '@machinat/webview';
import { parse as parseBrowser } from 'bowser';
import { TWITTER } from '../constant';
import TwitterChat from '../Chat';
import TwitterTweetTarget from '../TweetTarget';
import TwitterUser from '../User';
import TwitterUserProfile from '../UserProfile';
import { getAuthContextDetails } from './utils';
import type { TwitterAuthContext, TwitterAuthData } from './types';

type TwitterClientOptions = {
  /** The agent user id */
  agentId: string;
};

/* eslint-disable class-methods-use-this */
export default class TwitterClientAuthenticator
  implements
    WebviewClientAuthenticator<void, TwitterAuthData, TwitterAuthContext>
{
  platform = TWITTER;
  agentId: string;
  marshalTypes = [
    TwitterChat,
    TwitterTweetTarget,
    TwitterUser,
    TwitterUserProfile,
  ];

  constructor({ agentId }: TwitterClientOptions) {
    this.agentId = agentId;
  }

  async init(): Promise<void> {
    // do nothing
  }

  async fetchCredential(): Promise<AuthenticatorCredentialResult<void>> {
    return {
      ok: false as const,
      code: 400,
      reason: 'should only initiate from backend',
    };
  }

  checkAuthData(data: TwitterAuthData): CheckDataResult<TwitterAuthContext> {
    if (data.agent !== this.agentId) {
      return { ok: false, code: 400, reason: 'agent not match' };
    }

    return {
      ok: true,
      contextDetails: getAuthContextDetails(data),
    };
  }

  closeWebview(): boolean {
    if (parseBrowser(window.navigator.userAgent).platform.type === 'desktop') {
      return false;
    }

    window.location.href = `https://twitter.com/messages/compose?recipient_id=${this.agentId}`;
    return true;
  }
}
