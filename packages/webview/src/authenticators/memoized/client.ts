/* eslint-disable class-methods-use-this */
// / <reference lib="DOM" />
import { nanoid } from 'nanoid';
import type {
  AuthenticatorCredentialResult,
  CheckDataResult,
} from '@sociably/auth';
import { MemoizedUser, MemoizedThread } from './instance';
import { WebviewClientAuthenticator } from '../../types';
import type { MemoizedAuthData, MemoizedAuthContext } from './types';

const USER_KEY = 'momoized_user';
const THREAD_KEY = 'memoized_thread';

class MemoizedClientAuthenticator
  implements
    WebviewClientAuthenticator<
      MemoizedAuthData,
      MemoizedAuthData,
      MemoizedAuthContext
    >
{
  platform = 'memoized';
  marshalTypes = [MemoizedUser, MemoizedThread];

  async init(): Promise<void> {}

  async fetchCredential(): Promise<
    AuthenticatorCredentialResult<MemoizedAuthData>
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
  }: MemoizedAuthData): CheckDataResult<MemoizedAuthContext> {
    return {
      ok: true,
      contextDetails: {
        channel: null,
        user: new MemoizedUser(userId),
        thread: new MemoizedThread(threadId),
      },
    };
  }

  closeWebview(): boolean {
    return false;
  }
}

export default MemoizedClientAuthenticator;
