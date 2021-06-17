import type { AuthorizerCredentialResult, ContextResult } from '@machinat/auth';
import type { WebviewClientAuthorizer } from '@machinat/webview';
import { TELEGRAM } from '../constant';
import { TelegramChat, TelegramChatTarget } from '../channel';
import TelegramUser from '../user';
import { TelegramUserProfile, TelegramChatProfile } from '../profiler';
import { supplementContext } from './utils';
import { TelegramAuthContext, TelegramAuthData } from './types';

/* eslint-disable class-methods-use-this */
export default class TelegramClientAuthorizer
  implements
    WebviewClientAuthorizer<void, TelegramAuthData, TelegramAuthContext>
{
  platform = TELEGRAM;
  marshalTypes = [
    TelegramChat,
    TelegramChatTarget,
    TelegramUser,
    TelegramUserProfile,
    TelegramChatProfile,
  ];

  async init(): Promise<void> {
    // do nothing
  }

  async fetchCredential(): Promise<AuthorizerCredentialResult<void>> {
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
}
