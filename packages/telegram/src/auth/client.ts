import {
  ClientAuthorizer,
  AuthorizerRefinement,
  AuthorizerCredentialResult,
} from '@machinat/auth/types';
import { TELEGRAM } from '../constant';
import { refineTelegramAuthData } from './utils';
import { TelegramAuthData } from './types';

/* eslint-disable class-methods-use-this */
export default class TelegramClientAuthorizer
  implements ClientAuthorizer<TelegramAuthData, void> {
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
  ): Promise<null | AuthorizerRefinement> {
    return refineTelegramAuthData(data);
  }
}
