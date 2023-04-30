/// <reference lib="DOM" />
import type {
  AuthenticatorCredentialResult,
  CheckDataResult,
} from '@sociably/auth';
import type { WebviewClientAuthenticator } from '@sociably/webview';
import { parse as parseBrowser } from 'bowser';
import { TWITTER } from '../constant';
import TwitterChat from '../Chat';
import TwitterTweetTarget from '../TweetTarget';
import TwitterUser from '../User';
import TwitterUserProfile from '../UserProfile';
import { getAuthContextDetails } from './utils';
import type { TwitterAuthContext, TwitterAuthData } from './types';

/* eslint-disable class-methods-use-this */
export default class TwitterClientAuthenticator
  implements
    WebviewClientAuthenticator<void, TwitterAuthData, TwitterAuthContext>
{
  platform = TWITTER;
  marshalTypes = [
    TwitterChat,
    TwitterTweetTarget,
    TwitterUser,
    TwitterUserProfile,
  ];

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
    return {
      ok: true,
      contextDetails: getAuthContextDetails(data),
    };
  }

  closeWebview(context: null | TwitterAuthContext): boolean {
    if (
      !context ||
      parseBrowser(window.navigator.userAgent).platform.type === 'desktop'
    ) {
      return false;
    }

    window.location.href = `https://twitter.com/messages/compose?recipient_id=${context.agentId}`;
    return true;
  }
}
