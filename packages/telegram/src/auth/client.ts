import {
  ClientAuthorizer,
  AuthorizerCredentialResult,
} from '@machinat/auth/types';
import { TELEGRAM } from '../constant';
import type { TelegramChat } from '../channel';
import type TelegramUser from '../user';
import { refineTelegramAuthData } from './utils';
import { TelegramAuthData, TelegramAuthRefinement } from './types';

/* eslint-disable class-methods-use-this */
export default class TelegramClientAuthorizer
  implements
    ClientAuthorizer<
      TelegramUser,
      null | TelegramChat,
      TelegramAuthData,
      void
    > {
  platform = TELEGRAM;
  shouldResign = false;

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
  async refineAuth(
    data: TelegramAuthData
  ): Promise<null | TelegramAuthRefinement> {
    return refineTelegramAuthData(data);
  }
}
