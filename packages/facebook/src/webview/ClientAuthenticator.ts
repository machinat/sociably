/// <reference lib="DOM" />
import type {
  AuthenticatorCredentialResult,
  CheckDataResult,
} from '@sociably/auth';
import type { WebviewClientAuthenticator } from '@sociably/webview';
import { parse as parseBrowser } from 'bowser';
import { FACEBOOK } from '../constant';
import FacebookChat from '../Chat';
import FacebookUser from '../User';
import FacebookUserProfile from '../UserProfile';
import { getAuthContextDetails } from './utils';
import type { FacebookAuthContext, FacebookAuthData } from './types';

type FacebookClientOptions = {
  /** The Facebook page id */
  pageId: string;
};

/* eslint-disable class-methods-use-this */
export default class FacebookClientAuthenticator
  implements
    WebviewClientAuthenticator<void, FacebookAuthData, FacebookAuthContext>
{
  platform = FACEBOOK;
  pageId: string;
  marshalTypes = [FacebookChat, FacebookUser, FacebookUserProfile];

  constructor({ pageId }: FacebookClientOptions) {
    this.pageId = pageId;
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

  checkAuthData(data: FacebookAuthData): CheckDataResult<FacebookAuthContext> {
    if (data.page !== this.pageId) {
      return { ok: false, code: 400, reason: 'page not match' };
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

    window.location.href = `https://m.me/${this.pageId}`;
    return true;
  }
}
