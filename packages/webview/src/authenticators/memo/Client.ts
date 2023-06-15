/* eslint-disable class-methods-use-this */
// / <reference lib="DOM" />
import { nanoid } from 'nanoid';
import type {
  AuthenticatorCredentialResult,
  CheckDataResult,
} from '@sociably/auth';
import MemoCacheTarget from './CacheTarget.js';
import WebviewConnection from '../../Connection.js';
import { WebviewClientAuthenticator } from '../../types.js';
import type { MemoAuthData, MemoAuthContext } from './types.js';
import { WEBVIEW } from '../../constant.js';

const USER_KEY = 'momoized_user';
const THREAD_KEY = 'memo_thread';

class MemoClientAuthenticator
  implements
    WebviewClientAuthenticator<MemoAuthData, MemoAuthData, MemoAuthContext>
{
  readonly platform = WEBVIEW;
  readonly marshalTypes = [WebviewConnection, MemoCacheTarget];

  async init(): Promise<{ forceSignIn: boolean }> {
    return { forceSignIn: true };
  }

  async fetchCredential(): Promise<
    AuthenticatorCredentialResult<MemoAuthData>
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
  }: MemoAuthData): CheckDataResult<MemoAuthContext> {
    return {
      ok: true,
      contextDetails: {
        channel: null,
        user: new MemoCacheTarget('localStorage', userId),
        thread: new MemoCacheTarget('sessionStorage', threadId),
      },
    };
  }

  closeWebview(): boolean {
    return false;
  }
}

export default MemoClientAuthenticator;
