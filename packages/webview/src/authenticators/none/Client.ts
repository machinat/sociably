/* eslint-disable class-methods-use-this */
// / <reference lib="DOM" />
import { nanoid } from 'nanoid';
import type {
  AuthenticatorCredentialResult,
  CheckDataResult,
} from '@sociably/auth';
import WebviewConnection from '../../Connection.js';
import { WebviewClientAuthenticator } from '../../types.js';
import type { NoneAuthData, NoneAuthContext } from './types.js';
import { NONE } from './constant.js';

const USER_KEY = 'none_user';
const THREAD_KEY = 'none_thread';

class NoneClientAuthenticator
  implements
    WebviewClientAuthenticator<NoneAuthData, NoneAuthData, NoneAuthContext>
{
  readonly platform = NONE;
  readonly marshalTypes = [WebviewConnection];

  async init(): Promise<{ forceSignIn: boolean }> {
    return { forceSignIn: true };
  }

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

  checkAuthData(): CheckDataResult<NoneAuthContext> {
    return {
      ok: true,
      contextDetails: {
        channel: null,
        user: null,
        thread: null,
      },
    };
  }

  closeWebview(): boolean {
    return false;
  }
}

export default NoneClientAuthenticator;
