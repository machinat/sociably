/// <reference lib="DOM" />
import type {
  AuthenticatorCredentialResult,
  CheckDataResult,
} from '@sociably/auth';
import type { WebviewClientAuthenticator } from '@sociably/webview';
import { parse as parseBrowser } from 'bowser';
import { WHATSAPP } from '../constant';
import WhatsAppAgent from '../Agent';
import WhatsAppChat from '../Chat';
import WhatsAppUser from '../User';
import WhatsAppUserProfile from '../UserProfile';
import { getAuthContextDetails, trimWaUrlNumber } from './utils';
import type { WhatsAppAuthContext, WhatsAppAuthData } from './types';

/* eslint-disable class-methods-use-this */
export default class WhatsAppClientAuthenticator
  implements
    WebviewClientAuthenticator<void, WhatsAppAuthData, WhatsAppAuthContext>
{
  platform = WHATSAPP;
  marshalTypes = [
    WhatsAppAgent,
    WhatsAppChat,
    WhatsAppUser,
    WhatsAppUserProfile,
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

  checkAuthData(data: WhatsAppAuthData): CheckDataResult<WhatsAppAuthContext> {
    return {
      ok: true,
      contextDetails: getAuthContextDetails(data),
    };
  }

  closeWebview(authContext: null | WhatsAppAuthContext): boolean {
    if (
      !authContext ||
      parseBrowser(window.navigator.userAgent).platform.type === 'desktop'
    ) {
      return false;
    }

    window.location.href = `https://wa.me/${trimWaUrlNumber(
      authContext.agentNumber
    )}`;
    return true;
  }
}
