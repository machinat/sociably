/* eslint-disable class-methods-use-this */
// / <reference lib="DOM" />
import { nanoid } from 'nanoid';
import type {
  AuthenticatorCredentialResult,
  CheckDataResult,
} from '@sociably/auth';
import { NoneUser, NoneThread } from './instance';
import { WebviewClientAuthenticator } from '../types';
import type { NoneAuthData, NoneAuthContext } from './types';

const USER_KEY = 'none_user';
const THREAD_KEY = 'none_thread';

class NoneClientAuthenticator
  implements
    WebviewClientAuthenticator<NoneAuthData, NoneAuthData, NoneAuthContext>
{
  platform = 'none';
  marshalTypes = [NoneUser, NoneThread];

  async init(): Promise<void> {}

  async fetchCredential(): Promise<
    AuthenticatorCredentialResult<NoneAuthData>
  > {
    const existedUserId = window.localStorage.getItem(USER_KEY);
    const existedThreadId = window.sessionStorage.getItem(THREAD_KEY);

    let userId: string;
    if (existedUserId) {
      userId = existedUserId;
    } else {
      userId = nanoid();
      window.localStorage.setItem(USER_KEY, userId);
    }

    let threadId: string;
    if (existedThreadId) {
      threadId = existedThreadId;
    } else {
      threadId = nanoid();
      window.sessionStorage.setItem(THREAD_KEY, threadId);
    }

    return {
      ok: true as const,
      credential: {
        user: userId,
        thread: threadId,
      },
    };
  }

  checkAuthData({
    user: userId,
    thread: threadId,
  }: NoneAuthData): CheckDataResult<NoneAuthContext> {
    return {
      ok: true,
      contextDetails: {
        user: new NoneUser(userId),
        thread: new NoneThread(threadId),
      },
    };
  }

  closeWebview(): boolean {
    return false;
  }
}

export default NoneClientAuthenticator;
