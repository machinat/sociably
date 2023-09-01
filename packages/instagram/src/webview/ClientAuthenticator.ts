/// <reference lib="DOM" />
import type {
  AuthenticatorCredentialResult,
  CheckDataResult,
} from '@sociably/auth';
import type { WebviewClientAuthenticator } from '@sociably/webview';
import { INSTAGRAM } from '../constant.js';
import InstagramChat from '../Chat.js';
import InstagramUser from '../User.js';
import InstagramUserProfile from '../UserProfile.js';
import { getAuthContextDetails } from './utils.js';
import type { InstagramAuthContext, InstagramAuthData } from './types.js';

/* eslint-disable class-methods-use-this */
export default class InstagramClientAuthenticator
  implements
    WebviewClientAuthenticator<void, InstagramAuthData, InstagramAuthContext>
{
  platform = INSTAGRAM;
  marshalTypes = [InstagramChat, InstagramUser, InstagramUserProfile];

  async init(): Promise<{ forceSignIn: boolean }> {
    return { forceSignIn: false };
  }

  async fetchCredential(): Promise<AuthenticatorCredentialResult<void>> {
    return {
      ok: false as const,
      code: 400,
      reason: 'should only initiate from backend',
    };
  }

  checkAuthData(
    data: InstagramAuthData
  ): CheckDataResult<InstagramAuthContext> {
    return {
      ok: true,
      contextDetails: getAuthContextDetails(data),
    };
  }

  closeWebview(): boolean {
    return false;
  }
}
