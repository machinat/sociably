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

/* eslint-disable class-methods-use-this */
export default class FacebookClientAuthenticator
  implements
    WebviewClientAuthenticator<void, FacebookAuthData, FacebookAuthContext>
{
  platform = FACEBOOK;
  marshalTypes = [FacebookChat, FacebookUser, FacebookUserProfile];

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
    return {
      ok: true,
      contextDetails: getAuthContextDetails(data),
    };
  }

  closeWebview(ctx: null | FacebookAuthContext): boolean {
    if (
      !ctx ||
      parseBrowser(window.navigator.userAgent).platform.type === 'desktop'
    ) {
      return false;
    }

    window.location.href = `https://m.me/${ctx.thread.pageId}`;
    return true;
  }
}
