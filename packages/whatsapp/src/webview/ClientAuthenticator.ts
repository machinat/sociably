/// <reference lib="DOM" />
import type {
  AuthenticatorCredentialResult,
  CheckDataResult,
} from '@sociably/auth';
import type { WebviewClientAuthenticator } from '@sociably/webview';
import { parse as parseBrowser } from 'bowser';
import { WHATSAPP } from '../constant';
import WhatsAppChat from '../Chat';
import WhatsAppUser from '../User';
import WhatsAppUserProfile from '../UserProfile';
import { getAuthContextDetails } from './utils';
import type { WhatsAppAuthContext, WhatsAppAuthData } from './types';

type WhatsAppClientOptions = {
  /** The business phone number id  */
  businessNumber: string;
};

/* eslint-disable class-methods-use-this */
export default class WhatsAppClientAuthenticator
  implements
    WebviewClientAuthenticator<void, WhatsAppAuthData, WhatsAppAuthContext>
{
  platform = WHATSAPP;
  businessNumber: string;
  marshalTypes = [WhatsAppChat, WhatsAppUser, WhatsAppUserProfile];

  constructor({ businessNumber }: WhatsAppClientOptions) {
    this.businessNumber = businessNumber;
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

  checkAuthData(data: WhatsAppAuthData): CheckDataResult<WhatsAppAuthContext> {
    if (data.business !== this.businessNumber) {
      return { ok: false, code: 400, reason: 'business number not match' };
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

    window.location.href = `https://wa.me/${this.businessNumber}`;
    return true;
  }
}
