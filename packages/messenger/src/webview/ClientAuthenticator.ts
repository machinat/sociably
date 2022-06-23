/// <reference lib="DOM" />
import type {
  AuthenticatorCredentialResult,
  CheckDataResult,
} from '@sociably/auth';
import type { WebviewClientAuthenticator } from '@sociably/webview';
import { parse as parseBrowser } from 'bowser';
import { MESSENGER } from '../constant';
import MessengerChat from '../Chat';
import MessengerUser from '../User';
import MessengerUserProfile from '../UserProfile';
import { getAuthContextDetails } from './utils';
import type { MessengerAuthContext, MessengerAuthData } from './types';

type MessengerClientOptions = {
  /** The Facebook page id */
  pageId: string;
};

/* eslint-disable class-methods-use-this */
export default class MessengerClientAuthenticator
  implements
    WebviewClientAuthenticator<void, MessengerAuthData, MessengerAuthContext>
{
  platform = MESSENGER;
  pageId: string;
  marshalTypes = [MessengerChat, MessengerUser, MessengerUserProfile];

  constructor({ pageId }: MessengerClientOptions) {
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

  checkAuthData(
    data: MessengerAuthData
  ): CheckDataResult<MessengerAuthContext> {
    if (data.page !== this.pageId) {
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

    window.location.href = `https://m.me/${this.pageId}`;
    return true;
  }
}
