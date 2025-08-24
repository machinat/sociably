/// <reference lib="DOM" />
import type {
  AuthenticatorCredentialResult,
  CheckDataResult,
} from '@sociably/auth';
import type { WebviewClientAuthenticator } from '@sociably/webview';
import Bowser from 'bowser';
import { WHATSAPP } from '../constant.js';
import WhatsAppAgent from '../Agent.js';
import WhatsAppChat from '../Chat.js';
import WhatsAppUser from '../User.js';
import WhatsAppUserProfile from '../UserProfile.js';
import { getAuthContextDetails, trimWaUrlNumber } from './utils.js';
import type { WhatsAppAuthContext, WhatsAppAuthData } from './types.js';

const { parse: parseBrowser } = Bowser;

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
      authContext.agentNumber,
    )}`;
    return true;
  }
}
