/// <reference lib="DOM" />
import type {
  AuthenticatorCredentialResult,
  ContextResult,
} from '@machinat/auth';
import type { WebviewClientAuthenticator } from '@machinat/webview';
import { parse as parseBrowser } from 'bowser';
import { TELEGRAM } from '../constant';
import { TelegramChat, TelegramChatTarget } from '../channel';
import TelegramUser from '../user';
import { TelegramUserProfile, TelegramChatProfile } from '../profiler';
import { supplementContext } from './utils';
import { TelegramAuthContext, TelegramAuthData } from './types';

type TelegramClientOptions = {
  /** The `username` of the bot. Needed to make `.closeWebview()` work */
  botName?: string;
};

/* eslint-disable class-methods-use-this */
export default class TelegramClientAuthenticator
  implements
    WebviewClientAuthenticator<void, TelegramAuthData, TelegramAuthContext>
{
  platform = TELEGRAM;
  botName?: string;
  marshalTypes = [
    TelegramChat,
    TelegramChatTarget,
    TelegramUser,
    TelegramUserProfile,
    TelegramChatProfile,
  ];

  constructor({ botName }: TelegramClientOptions = {}) {
    this.botName = botName;
  }

  async init(): Promise<void> {
    // do nothing
  }

  async fetchCredential(): Promise<AuthenticatorCredentialResult<void>> {
    return {
      success: false as const,
      code: 400,
      reason: 'should only initiate from backend',
    };
  }

  // eslint-disable-next-line class-methods-use-this
  checkAuthContext(data: TelegramAuthData): ContextResult<TelegramAuthContext> {
    return {
      success: true,
      contextSupplment: supplementContext(data),
    };
  }

  closeWebview(): boolean {
    if (
      !this.botName ||
      parseBrowser(window.navigator.userAgent).platform.type === 'desktop'
    ) {
      return false;
    }

    window.location.href = `https://telegram.me/${this.botName}`;
    return true;
  }
}
