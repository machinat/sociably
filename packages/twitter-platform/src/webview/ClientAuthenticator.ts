/// <reference lib="DOM" />
import type {
  AuthenticatorCredentialResult,
  CheckDataResult,
} from '@sociably/auth';
import type { WebviewClientAuthenticator } from '@sociably/webview';
import Bowser from 'bowser';
import { TWITTER } from '../constant.js';
import TwitterChat from '../Chat.js';
import TwitterTweetTarget from '../TweetTarget.js';
import TwitterUser from '../User.js';
import TwitterUserProfile from '../UserProfile.js';
import { getAuthContextDetails } from './utils.js';
import type { TwitterAuthContext, TwitterAuthData } from './types.js';

const { parse: parseBrowser } = Bowser;

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

  async init(): Promise<{ forceSignIn: boolean }> {
    // do nothing
    return { forceSignIn: false };
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
