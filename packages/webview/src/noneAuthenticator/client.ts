/* eslint-disable class-methods-use-this */
// / <reference lib="DOM" />
import { nanoid } from 'nanoid';
import type {
  ClientAuthenticator,
  AuthenticatorCredentialResult,
  ContextResult,
} from '@machinat/auth';
import { NoneUser, NoneChannel } from './instance';
import { NoneAuthData, NoneAuthContext } from './types';

const USER_KEY = 'none_user';
const CHANNEL_KEY = 'none_channel';

class NoneClientAuthenticator
  implements ClientAuthenticator<NoneAuthData, NoneAuthData, NoneAuthContext>
{
  platform = 'none';

  async init(): Promise<void> {}

  async fetchCredential(): Promise<
    AuthenticatorCredentialResult<NoneAuthData>
  > {
    const existedUserId = window.localStorage.getItem(USER_KEY);
    const existedChannelId = window.sessionStorage.getItem(CHANNEL_KEY);

    let userId: string;
    if (existedUserId) {
      userId = existedUserId;
    } else {
      userId = nanoid();
      window.localStorage.setItem(USER_KEY, userId);
    }

    let channelId: string;
    if (existedChannelId) {
      channelId = existedChannelId;
    } else {
      channelId = nanoid();
      window.sessionStorage.setItem(CHANNEL_KEY, channelId);
    }

    return {
      success: true as const,
      credential: {
        user: userId,
        channel: channelId,
      },
    };
  }

  checkAuthContext({
    user: userId,
    channel: channelId,
  }: NoneAuthData): ContextResult<NoneAuthContext> {
    return {
      success: true,
      contextSupplment: {
        user: new NoneUser(userId),
        channel: new NoneChannel(channelId),
      },
    };
  }
}

export default NoneClientAuthenticator;
