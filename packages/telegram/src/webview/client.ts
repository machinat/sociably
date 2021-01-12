import {
  ClientAuthorizer,
  AuthorizerCredentialResult,
  ContextSupplement,
} from '@machinat/auth/types';
import { TELEGRAM } from '../constant';
import { supplementContext } from './utils';
import { TelegramAuthContext, TelegramAuthData } from './types';

/* eslint-disable class-methods-use-this */
export default class TelegramClientAuthorizer
  implements ClientAuthorizer<void, TelegramAuthData, TelegramAuthContext> {
  platform = TELEGRAM;

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
  async supplementContext(
    data: TelegramAuthData
  ): Promise<null | ContextSupplement<TelegramAuthContext>> {
    return supplementContext(data);
  }
}
