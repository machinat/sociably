/// <reference lib="DOM" />
import type {
  AuthenticatorCredentialResult,
  CheckDataResult,
} from '@sociably/auth';
import type { WebviewClientAuthenticator } from '@sociably/webview';
import { parse as parseBrowser } from 'bowser';
import { TELEGRAM } from '../constant';
import TelegramChat from '../Chat';
import TelegramChatSender from '../ChatSender';
import TelegramChatProfile from '../ChatProfile';
import TelegramUser from '../User';
import TelegramUserProfile from '../UserProfile';
import { getAuthContextDetails } from './utils';
import { REDIRECT_QUERY, BOT_ID_QUERY, CHAT_ID_QUERY } from './constant';
import type { TelegramAuthContext, TelegramAuthData } from './types';

type TelegramClientOptions = {
  /** The ID of the bot to login with. Default to `botId` query param */
  botId?: number;
  /** The chat room ID that refer to the page. Default to `chatId` query param */
  chatId?: number;
};

/* eslint-disable class-methods-use-this */
export default class TelegramClientAuthenticator
  implements
    WebviewClientAuthenticator<void, TelegramAuthData, TelegramAuthContext>
{
  platform = TELEGRAM;
  botId: number;
  chatId?: number;
  marshalTypes = [
    TelegramChat,
    TelegramUser,
    TelegramChatSender,
    TelegramUserProfile,
    TelegramChatProfile,
  ];

  constructor(options?: TelegramClientOptions) {
    // NOTE: postpone `botId` check to init() for SSR
    this.botId = options?.botId ?? 0;
    this.chatId = options?.chatId;
  }

  async init(
    authEntry: string,
    errorFromServer: null | Error,
    dataFromServer: null | TelegramAuthData
  ): Promise<void> {
    const searchParams = new URLSearchParams(window.location.search);
    if (!this.botId) {
      const botIdQuery = searchParams.get(BOT_ID_QUERY);

      if (botIdQuery) {
        this.botId = parseInt(botIdQuery, 10);
      } else if (dataFromServer) {
        this.botId = dataFromServer.botId;
      }
    }
    if (!this.botId || Number.isNaN(this.botId)) {
      throw new Error(
        'Telegram bot ID is required on either `options.botId` or `botId` querystring'
      );
    }

    if (!this.chatId) {
      const chatIdQuery = searchParams.get(CHAT_ID_QUERY);
      if (chatIdQuery) {
        this.chatId = parseInt(chatIdQuery, 10);
      }
    }

    if (
      (!errorFromServer && !dataFromServer) ||
      (dataFromServer && dataFromServer.botId !== this.botId)
    ) {
      const authUrl = new URL('login', authEntry);
      authUrl.searchParams.set(BOT_ID_QUERY, this.botId.toString());
      authUrl.searchParams.set(REDIRECT_QUERY, window.location.href);
      if (this.chatId) {
        authUrl.searchParams.set(CHAT_ID_QUERY, this.chatId.toString());
      }

      window.location.href = authUrl.href;
      await new Promise((_, reject) =>
        setTimeout(() => reject(new Error('redirect timeout')), 5000)
      );
    }
  }

  async fetchCredential(): Promise<AuthenticatorCredentialResult<void>> {
    return {
      ok: false as const,
      code: 400,
      reason: 'should only initiate from backend',
    };
  }

  // eslint-disable-next-line class-methods-use-this
  checkAuthData(data: TelegramAuthData): CheckDataResult<TelegramAuthContext> {
    return {
      ok: true,
      contextDetails: getAuthContextDetails(data),
    };
  }

  closeWebview(context: null | TelegramAuthContext): boolean {
    if (
      !context ||
      parseBrowser(window.navigator.userAgent).platform.type === 'desktop'
    ) {
      return false;
    }

    window.location.href = `https://telegram.me/${context.botName}`;
    return true;
  }
}
