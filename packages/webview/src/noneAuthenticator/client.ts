/* eslint-disable class-methods-use-this */
// / <reference lib="DOM" />
import { nanoid } from 'nanoid';
import type {
  AuthenticatorCredentialResult,
  CheckDataResult,
} from '@machinat/auth';
import { NoneUser, NoneChannel } from './instance';
import { WebviewClientAuthenticator } from '../types';
import type { NoneAuthData, NoneAuthContext } from './types';

const USER_KEY = 'none_user';
const CHANNEL_KEY = 'none_channel';

class NoneClientAuthenticator
  implements
    WebviewClientAuthenticator<NoneAuthData, NoneAuthData, NoneAuthContext>
{
  platform = 'none';
  marshalTypes = [NoneUser, NoneChannel];

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
      ok: true as const,
      credential: {
        user: userId,
        channel: channelId,
      },
    };
  }

  checkAuthData({
    user: userId,
    channel: channelId,
  }: NoneAuthData): CheckDataResult<NoneAuthContext> {
    return {
      ok: true,
      contextDetails: {
        user: new NoneUser(userId),
        channel: new NoneChannel(channelId),
      },
    };
  }

  closeWebview(): boolean {
    return false;
  }
}

export default NoneClientAuthenticator;
